import { z } from "zod";

/**
 * Schema for validating case input BEFORE saving to Firestore
 */
export const CaseSchema = z.object({
  requester_first_name: z.string().min(1),
  requester_last_name: z.string().min(1),
  requester_phone: z.string().min(5),

  city: z.string().min(1),
  street: z.string().min(1),
  house_number: z.string().optional(),

  location_description: z.string().min(1),
  height_from_ground: z.number().positive(),

  floor: z.string().min(1), // ✅ mandatory

  navigation_link: z.string().nullable().optional(),

  urgency: z.enum(["low", "medium", "high"]),
  first_seen: z.enum([
  "1_day",
  "2_days",
  "3_days",
  "4_plus_days"
]).nullable().optional(),

  coordinator_id: z.string(),
  status: z.enum(["open", "assigned", "closed"]).default("open"),
  result_status: z.enum(["in_progress", "evacuated_by_volunteer", "sent_to_chofesh_farm", "remains_in_place_without_treatment", "cancelled"]).default("in_progress"),
  result_notes: z.string().nullable().optional(),

  case_complexity: z
    .enum(["simple", "complex", "very_complex"])
    .default("simple"),

  // ✅ Timestamps
  opened_at: z.any().optional(), // Firestore Timestamp - set when case is created
  closed_at: z.any().nullable().optional(), // Firestore Timestamp - set when case is closed, null when reopened
  closed_by: z.object({
    user_id: z.string(),
    full_name: z.string(),
    role: z.string(),
  }).nullable().optional(), // ✅ Track who closed the case (volunteer or coordinator)
});