import mongoose from 'mongoose';
import { log } from './vite';
import { User, FaceSample } from '@shared/schema';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vikashkushwaha:Vikash08@cluster0.e444nuw.mongodb.net/Face_Recognition?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    log('Connected to MongoDB!', 'mongodb');
    return true;
  } catch (error) {
    log(`MongoDB connection error: ${error}`, 'mongodb');
    console.error('MongoDB connection error:', error);
    return false;
  }
}

// Define schemas matching our shared types
const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, default: null },
  lastName: { type: String, default: null },
  faceDescriptor: { type: [Number], default: null },
  encryptionKey: { type: String, default: null },
  faceDataEncrypted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const faceSampleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  descriptor: { type: [Number], required: true },
  timestamp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create models with proper typing
export const UserModel = mongoose.model<User & mongoose.Document>('User', userSchema);
export const FaceSampleModel = mongoose.model<FaceSample & mongoose.Document>('FaceSample', faceSampleSchema);