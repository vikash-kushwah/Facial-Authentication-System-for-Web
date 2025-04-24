import { users, faceSamples, type User, type InsertUser, type FaceSample, type FaceDescriptor } from "@shared/schema";
import crypto from 'crypto';
import { UserModel, FaceSampleModel } from './db';
import { log } from './vite';

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, faceDescriptor?: FaceDescriptor): Promise<User>;
  updateUserFaceDescriptor(id: number, faceDescriptor: FaceDescriptor): Promise<User | undefined>;
  addFaceSample(userId: number, descriptor: FaceDescriptor): Promise<FaceSample>;
  getFaceSamplesByUserId(userId: number): Promise<FaceSample[]>;
  getAllFaceDescriptors(): Promise<{ userId: number, descriptor: FaceDescriptor }[]>;
}

// MongoDB Storage Implementation
export class MongoStorage implements IStorage {
  private counters: {
    userId: number;
    faceSampleId: number;
  };

  constructor() {
    this.counters = {
      userId: 1,
      faceSampleId: 1,
    };
    // Initialize counters from DB
    this.initCounters();
  }

  private async initCounters() {
    try {
      // Find highest user ID
      const lastUser = await UserModel.findOne().sort({ id: -1 });
      if (lastUser) {
        this.counters.userId = lastUser.id + 1;
      }

      // Find highest face sample ID
      const lastFaceSample = await FaceSampleModel.findOne().sort({ id: -1 });
      if (lastFaceSample) {
        this.counters.faceSampleId = lastFaceSample.id + 1;
      }
      
      log(`Initialized counters: userId=${this.counters.userId}, faceSampleId=${this.counters.faceSampleId}`, 'mongodb');
    } catch (error) {
      console.error('Error initializing counters:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ id }).lean();
      if (!user) return undefined;
      return this.mongoDocToUser(user);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username }).lean();
      if (!user) return undefined;
      return this.mongoDocToUser(user);
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email }).lean();
      if (!user) return undefined;
      return this.mongoDocToUser(user);
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }
  
  // Helper method to convert MongoDB document to User type
  private mongoDocToUser(doc: any): User {
    return {
      id: doc.id,
      username: doc.username,
      firstName: doc.firstName || null,
      lastName: doc.lastName || null,
      email: doc.email,
      password: doc.password,
      faceDescriptor: doc.faceDescriptor,
      encryptionKey: doc.encryptionKey || null,
      faceDataEncrypted: doc.faceDataEncrypted || false
    };
  }

  async createUser(insertUser: InsertUser, faceDescriptor?: FaceDescriptor): Promise<User> {
    try {
      const id = this.counters.userId++;
      
      // Generate encryption key for face data
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      
      const userData = { 
        ...insertUser, 
        id,
        firstName: insertUser.firstName || null,
        lastName: insertUser.lastName || null,
        faceDescriptor: faceDescriptor || null,
        encryptionKey: encryptionKey,
        faceDataEncrypted: !!faceDescriptor
      };
      
      // Create new user in MongoDB
      const newUser = await UserModel.create(userData);
      return this.mongoDocToUser(newUser.toObject());
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async updateUserFaceDescriptor(id: number, faceDescriptor: FaceDescriptor): Promise<User | undefined> {
    try {
      const updatedUser = await UserModel.findOneAndUpdate(
        { id },
        { 
          faceDescriptor,
          faceDataEncrypted: true 
        },
        { new: true }
      ).lean();
      
      if (!updatedUser) return undefined;
      return this.mongoDocToUser(updatedUser);
    } catch (error) {
      console.error('Error updating user face descriptor:', error);
      return undefined;
    }
  }

  async addFaceSample(userId: number, descriptor: FaceDescriptor): Promise<FaceSample> {
    try {
      const id = this.counters.faceSampleId++;
      const timestamp = new Date().toISOString();
      
      const faceSampleData = {
        id,
        userId,
        descriptor,
        timestamp
      };
      
      const newFaceSample = await FaceSampleModel.create(faceSampleData);
      const faceSample = newFaceSample.toObject();
      
      // Create a properly typed FaceSample object
      return {
        id: faceSample.id,
        userId: faceSample.userId,
        descriptor: faceSample.descriptor,
        timestamp: faceSample.timestamp || timestamp
      };
    } catch (error) {
      console.error('Error adding face sample:', error);
      throw new Error('Failed to add face sample');
    }
  }

  async getFaceSamplesByUserId(userId: number): Promise<FaceSample[]> {
    try {
      const samples = await FaceSampleModel.find({ userId }).lean();
      
      // Convert MongoDB documents to FaceSample objects
      return samples.map(sample => ({
        id: sample.id,
        userId: sample.userId,
        descriptor: sample.descriptor,
        timestamp: sample.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error getting face samples by user ID:', error);
      return [];
    }
  }

  async getAllFaceDescriptors(): Promise<{ userId: number, descriptor: FaceDescriptor }[]> {
    try {
      const users = await UserModel.find({ faceDescriptor: { $ne: null } }).lean();
      
      return users.map(user => ({
        userId: user.id,
        descriptor: user.faceDescriptor as FaceDescriptor
      }));
    } catch (error) {
      console.error('Error getting all face descriptors:', error);
      return [];
    }
  }
}

// In-memory Storage Implementation (fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private faceSamples: Map<number, FaceSample>;
  currentUserId: number;
  currentFaceSampleId: number;

  constructor() {
    this.users = new Map();
    this.faceSamples = new Map();
    this.currentUserId = 1;
    this.currentFaceSampleId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser, faceDescriptor?: FaceDescriptor): Promise<User> {
    const id = this.currentUserId++;
    
    // Generate encryption key for face data
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    const user: User = { 
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      id,
      faceDescriptor: faceDescriptor || null,
      encryptionKey: encryptionKey,
      faceDataEncrypted: !!faceDescriptor
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUserFaceDescriptor(id: number, faceDescriptor: FaceDescriptor): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      faceDescriptor,
      faceDataEncrypted: true
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async addFaceSample(userId: number, descriptor: FaceDescriptor): Promise<FaceSample> {
    const id = this.currentFaceSampleId++;
    const timestamp = new Date().toISOString();
    
    const faceSample: FaceSample = {
      id,
      userId,
      descriptor,
      timestamp
    };
    
    this.faceSamples.set(id, faceSample);
    return faceSample;
  }

  async getFaceSamplesByUserId(userId: number): Promise<FaceSample[]> {
    return Array.from(this.faceSamples.values()).filter(
      (sample) => sample.userId === userId
    );
  }

  async getAllFaceDescriptors(): Promise<{ userId: number, descriptor: FaceDescriptor }[]> {
    return Array.from(this.users.values())
      .filter(user => user.faceDescriptor !== null)
      .map(user => ({
        userId: user.id,
        descriptor: user.faceDescriptor as FaceDescriptor
      }));
  }
}

// Use MongoDB storage as primary, with in-memory as fallback
export const storage = new MongoStorage();
