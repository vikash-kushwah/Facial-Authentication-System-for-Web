import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  faceDescriptor: jsonb("face_descriptor"),
  encryptionKey: text("encryption_key"),
  faceDataEncrypted: boolean("face_data_encrypted").default(false),
});

export const faceSamples = pgTable("face_samples", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  descriptor: jsonb("descriptor").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  firstName: true,
  lastName: true,
  email: true,
  password: true,
});

export const loginUserSchema = z.object({
  email: z.string().email(),
  faceDescriptor: z.array(z.number()).optional(),
});

export const faceDescriptorSchema = z.array(z.number());

export const similarityTestSchema = z.object({
  face1: z.array(z.number()),
  face2: z.array(z.number()),
});

export const matchTestSchema = z.object({
  probeFace: z.array(z.number()),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type FaceSample = typeof faceSamples.$inferSelect;
export type FaceDescriptor = z.infer<typeof faceDescriptorSchema>;
export type SimilarityTest = z.infer<typeof similarityTestSchema>;
export type MatchTest = z.infer<typeof matchTestSchema>;
