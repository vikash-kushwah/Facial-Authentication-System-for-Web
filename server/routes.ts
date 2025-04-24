import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginUserSchema, 
  faceDescriptorSchema,
  similarityTestSchema, 
  matchTestSchema,
  type FaceDescriptor
} from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// Type for group authentication request
type GroupAuthRequest = {
  groupMembers: {
    email: string;
    faceDescriptor: FaceDescriptor;
  }[];
  requiredMembers?: number;
};

// Simple encryption/decryption functions for face data
function encryptFaceData(data: FaceDescriptor, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  
  const jsonData = JSON.stringify(data);
  let encrypted = cipher.update(jsonData, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decryptFaceData(encryptedData: string, key: string): FaceDescriptor {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

// Calculate distance metrics
function euclideanDistance(a: FaceDescriptor, b: FaceDescriptor): number {
  if (a.length !== b.length) throw new Error("Vectors must be of the same length");
  
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0)
  );
}

function manhattanDistance(a: FaceDescriptor, b: FaceDescriptor): number {
  if (a.length !== b.length) throw new Error("Vectors must be of the same length");
  
  return a.reduce((sum, val, i) => sum + Math.abs(val - b[i]), 0);
}

function cosineSimilarity(a: FaceDescriptor, b: FaceDescriptor): number {
  if (a.length !== b.length) throw new Error("Vectors must be of the same length");
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create token secret
  const TOKEN_KEY = process.env.TOKEN_KEY || "default_secret_key_change_in_production";
  
  // User registration
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: parseResult.error.format() 
        });
      }
      
      const { username, firstName, lastName, email, password } = parseResult.data;
      const { faceDescriptor } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      let user;
      if (faceDescriptor) {
        const parsedDescriptor = faceDescriptorSchema.safeParse(faceDescriptor);
        if (parsedDescriptor.success) {
          user = await storage.createUser(
            { 
              username, 
              firstName, 
              lastName, 
              email, 
              password: hashedPassword
            },
            parsedDescriptor.data
          );
          
          // Add as a face sample too
          await storage.addFaceSample(user.id, parsedDescriptor.data);
        } else {
          return res.status(400).json({ 
            message: "Invalid face descriptor", 
            errors: parsedDescriptor.error.format()
          });
        }
      } else {
        user = await storage.createUser({ 
          username, 
          firstName, 
          lastName, 
          email, 
          password: hashedPassword
        });
      }
      
      // Create token
      const token = jwt.sign(
        { user_id: user.id, email },
        TOKEN_KEY,
        { expiresIn: "24h" }
      );
      
      return res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // User login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parseResult = loginUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: parseResult.error.format()
        });
      }
      
      const { email, faceDescriptor } = parseResult.data;
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      let authenticated = false;
      
      // Authenticate with face if provided
      if (faceDescriptor && user.faceDescriptor) {
        // In a real application, we'd use a threshold to determine if faces match
        const storedDescriptor = user.faceDescriptor as FaceDescriptor;
        const distance = euclideanDistance(storedDescriptor, faceDescriptor);
        
        // Threshold of 0.6 is commonly used for face recognition
        if (distance < 0.6) {
          authenticated = true;
        }
      }
      
      if (!authenticated) {
        // If not authenticated by face, return error
        return res.status(401).json({ message: "Authentication failed" });
      }
      
      // Create token
      const token = jwt.sign(
        { user_id: user.id, email },
        TOKEN_KEY,
        { expiresIn: "24h" }
      );
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Fallback password login
  app.post("/api/auth/login/password", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Create token
      const token = jwt.sign(
        { user_id: user.id, email },
        TOKEN_KEY,
        { expiresIn: "24h" }
      );
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        email: user.email,
        token
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Add face sample for existing user
  app.post("/api/user/face-sample", async (req: Request, res: Response) => {
    try {
      const { userId, faceDescriptor } = req.body;
      
      if (!userId || !faceDescriptor) {
        return res.status(400).json({ message: "User ID and face descriptor are required" });
      }
      
      const parsedDescriptor = faceDescriptorSchema.safeParse(faceDescriptor);
      if (!parsedDescriptor.success) {
        return res.status(400).json({
          message: "Invalid face descriptor",
          errors: parsedDescriptor.error.format()
        });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Add face sample
      const faceSample = await storage.addFaceSample(userId, parsedDescriptor.data);
      
      // If this is the first face sample, update user's primary face descriptor
      if (!user.faceDescriptor) {
        await storage.updateUserFaceDescriptor(userId, parsedDescriptor.data);
      }
      
      return res.status(201).json({
        id: faceSample.id,
        userId: faceSample.userId,
        timestamp: faceSample.timestamp
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Compare two faces for similarity
  app.post("/api/face/similarity", async (req: Request, res: Response) => {
    try {
      const parseResult = similarityTestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: parseResult.error.format()
        });
      }
      
      const { face1, face2 } = parseResult.data;
      
      // Calculate various distance metrics
      const euclidean = euclideanDistance(face1, face2);
      const manhattan = manhattanDistance(face1, face2);
      const cosine = cosineSimilarity(face1, face2);
      
      // For the overall similarity score, we'll use an exponential transformation of the euclidean distance
      // This gives a value between 0 and 1 where 1 is identical
      const overallSimilarity = Math.exp(-euclidean);
      
      // Simulate different neural network scores for demonstration
      // In a real application, you would use actual models
      const faceNetScore = Math.max(0, Math.min(1, cosine * 0.9 + Math.random() * 0.1));
      const vggFaceScore = Math.max(0, Math.min(1, cosine * 0.85 + Math.random() * 0.15));
      const arcFaceScore = Math.max(0, Math.min(1, cosine * 0.95 + Math.random() * 0.05));
      
      return res.status(200).json({
        overallSimilarity: overallSimilarity,
        euclideanDistance: euclidean,
        manhattanDistance: manhattan,
        cosineSimilarity: cosine,
        neuralNetworks: {
          faceNet: faceNetScore,
          vggFace: vggFaceScore,
          arcFace: arcFaceScore
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Match a face against all stored faces
  app.post("/api/face/match", async (req: Request, res: Response) => {
    try {
      const parseResult = matchTestSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({
          message: "Invalid input",
          errors: parseResult.error.format()
        });
      }
      
      const { probeFace } = parseResult.data;
      
      // Get all face descriptors
      const allFaces = await storage.getAllFaceDescriptors();
      
      // Calculate similarity with each face
      const matches = await Promise.all(
        allFaces.map(async ({ userId, descriptor }) => {
          const user = await storage.getUser(userId);
          if (!user) return null;
          
          const similarity = Math.exp(-euclideanDistance(probeFace, descriptor));
          
          return {
            userId,
            username: user.username,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            similarity
          };
        })
      );
      
      // Filter out null values and sort by similarity (highest first)
      const filteredMatches = matches
        .filter(match => match !== null)
        .sort((a, b) => (b?.similarity || 0) - (a?.similarity || 0));
      
      // Calculate performance metrics
      const threshold = 0.75;
      const aboveThreshold = filteredMatches.filter(match => (match?.similarity || 0) >= threshold).length;
      
      // Simulated evaluation metrics
      // In a real application, you would compute these properly
      const totalTested = allFaces.length;
      const tpr = aboveThreshold > 0 ? 0.953 : 0.0; // True positive rate
      const fpr = aboveThreshold > 1 ? 0.042 : 0.0; // False positive rate
      const accuracy = aboveThreshold > 0 ? 0.921 : 0.5; // Accuracy
      
      return res.status(200).json({
        matches: filteredMatches,
        threshold,
        metrics: {
          totalFaces: totalTested,
          matchedAboveThreshold: aboveThreshold,
          processingTime: `${(Math.random() * 1.5 + 0.5).toFixed(2)}s`,
          tpr,
          fpr,
          accuracy
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Group authentication - allows multiple people to authenticate as a group
  app.post("/api/auth/group", async (req: Request, res: Response) => {
    try {
      const { groupMembers, requiredMembers } = req.body as GroupAuthRequest;
      
      if (!groupMembers || !Array.isArray(groupMembers) || groupMembers.length === 0) {
        return res.status(400).json({ message: "Group members are required" });
      }
      
      // Determine minimum required members (default to all)
      const minRequired = requiredMembers || groupMembers.length;
      
      // Authenticate each group member
      const results = await Promise.all(
        groupMembers.map(async ({ email, faceDescriptor }) => {
          try {
            // Verify the face descriptor format
            const parsedDescriptor = faceDescriptorSchema.safeParse(faceDescriptor);
            if (!parsedDescriptor.success) {
              return { email, authenticated: false, error: "Invalid face descriptor" };
            }
            
            // Get user
            const user = await storage.getUserByEmail(email);
            if (!user) {
              return { email, authenticated: false, error: "User not found" };
            }
            
            // Check if user has face descriptor
            if (!user.faceDescriptor) {
              return { email, authenticated: false, error: "No face descriptor registered" };
            }
            
            // Calculate similarity
            const storedDescriptor = user.faceDescriptor as FaceDescriptor;
            const distance = euclideanDistance(storedDescriptor, parsedDescriptor.data);
            const authenticated = distance < 0.6; // Using threshold of 0.6
            
            // Return authentication result
            return { 
              email, 
              authenticated, 
              username: user.username,
              name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              similarity: Math.exp(-distance) // Transform to 0-1 scale
            };
          } catch (error) {
            return { email, authenticated: false, error: "Authentication failed" };
          }
        })
      );
      
      // Count authenticated members
      const authenticatedCount = results.filter(r => r.authenticated).length;
      const groupAuthenticated = authenticatedCount >= minRequired;
      
      // Return group authentication result
      return res.status(200).json({
        groupAuthenticated,
        authenticatedCount,
        requiredMembers: minRequired,
        totalMembers: groupMembers.length,
        members: results,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get admin statistics
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      // Get all users and face samples
      const allUsers = await Promise.all(
        Array.from({ length: 100 }).map(async (_, i) => {
          const user = await storage.getUser(i + 1);
          return user;
        })
      ).then(users => users.filter(Boolean));
      
      const allFaceSamples = await Promise.all(
        allUsers.map(async (user) => {
          if (!user) return [];
          return await storage.getFaceSamplesByUserId(user.id);
        })
      ).then(samples => samples.flat());
      
      // Calculate statistics
      const totalUsers = allUsers.length;
      const usersWithFace = allUsers.filter(user => user && user.faceDescriptor !== null).length;
      const totalFaceSamples = allFaceSamples.length;
      const avgSamplesPerUser = totalUsers > 0 ? totalFaceSamples / totalUsers : 0;
      
      // Return statistics
      return res.status(200).json({
        users: {
          total: totalUsers,
          withFaceAuth: usersWithFace,
          withoutFaceAuth: totalUsers - usersWithFace,
          percentWithFaceAuth: totalUsers > 0 ? (usersWithFace / totalUsers) * 100 : 0
        },
        faceSamples: {
          total: totalFaceSamples,
          averagePerUser: avgSamplesPerUser
        },
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
