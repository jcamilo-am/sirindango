import { z } from 'zod';

export const UpdateEventSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  location: z.string().min(1, "Location is required").optional(),
  startDate: z.coerce.date({ invalid_type_error: "Invalid start date" }).optional(),
  endDate: z.coerce.date({ invalid_type_error: "Invalid end date" }).optional(),
  commissionAssociation: z.number().min(0).max(100).optional(),
  commissionSeller: z.number().min(0).max(100).optional(),
});