import { apiRequest } from "./queryClient";
import { FaceDescriptor } from "./face-api";

// User type
export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
}

// Register new user with or without face data
export async function registerUser(
  userData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  },
  faceDescriptor?: FaceDescriptor
): Promise<User> {
  const response = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      ...userData,
      faceDescriptor
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}

// Login with face recognition
export async function loginWithFace(
  email: string,
  faceDescriptor: FaceDescriptor
): Promise<User> {
  const response = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      faceDescriptor
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}

// Fallback login with password
export async function loginWithPassword(
  email: string,
  password: string
): Promise<User> {
  const response = await apiRequest("/api/auth/login/password", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}

// Add face sample for existing user
export async function addFaceSample(
  userId: number,
  faceDescriptor: FaceDescriptor
): Promise<{ id: number; userId: number; timestamp: string }> {
  const response = await apiRequest("/api/user/face-sample", {
    method: "POST",
    body: JSON.stringify({
      userId,
      faceDescriptor
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}

// Test similarity between two faces
export async function compareFaces(
  face1: FaceDescriptor,
  face2: FaceDescriptor
): Promise<{
  overallSimilarity: number;
  euclideanDistance: number;
  manhattanDistance: number;
  cosineSimilarity: number;
  neuralNetworks: {
    faceNet: number;
    vggFace: number;
    arcFace: number;
  };
}> {
  const response = await apiRequest("/api/face/similarity", {
    method: "POST",
    body: JSON.stringify({
      face1,
      face2
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}

// Match a face against all stored faces
export async function matchFace(
  probeFace: FaceDescriptor
): Promise<{
  matches: Array<{
    userId: number;
    username: string;
    name: string;
    similarity: number;
  }>;
  threshold: number;
  metrics: {
    totalFaces: number;
    matchedAboveThreshold: number;
    processingTime: string;
    tpr: number;
    fpr: number;
    accuracy: number;
  };
}> {
  const response = await apiRequest("/api/face/match", {
    method: "POST",
    body: JSON.stringify({
      probeFace
    }),
    headers: { "Content-Type": "application/json" }
  });
  return response;
}
