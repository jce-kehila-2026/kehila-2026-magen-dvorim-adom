import { z } from "zod";

/**
 * Schema for validating feedback BEFORE saving to Firestore
 */
export const FeedbackSchema = z.object({

  // Relation
  case_id: z.string().min(1),

  // Required ratings (1–4)
  administrative_rating: z
    .number()
    .int()
    .min(1, "Must be between 1 and 4")
    .max(4, "Must be between 1 and 4"),

  evacuation_rating: z
    .number()
    .int()
    .min(1, "Must be between 1 and 4")
    .max(4, "Must be between 1 and 4"),

  // Optional comments
  comments: z
    .string()
    .max(1000, "Too long")
    .nullable()
    .optional(),

  // Timestamp (Firestore)
  submitted_at: z.any().optional(),
});
