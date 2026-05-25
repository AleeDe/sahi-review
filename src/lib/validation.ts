import { z } from "zod";

export const feedbackSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/),
  rating: z.number().int().min(1).max(5),
  customer_name: z.string().trim().min(1).max(120),
  customer_phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
  // honeypot — must be empty
  hp: z.string().max(0).optional().or(z.literal("")),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
