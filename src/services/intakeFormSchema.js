import { z } from "zod";

/**
 * IntakeForm represents permission to submit ONE case.
 * It is created by a coordinator and consumed by a requester.
 */
export const IntakeFormSchema = z.object({
  requester_phone: z.string().min(5, "Requester phone is required"),

  coordinator_id: z.string().min(1, "Coordinator ID is required"),

  status: z.enum(["sent", "submitted", "expired"]),

  case_id: z.string().optional(),

  sent_at: z.date(),
  expires_at: z.date(),
  submitted_at: z.date().optional(),
});