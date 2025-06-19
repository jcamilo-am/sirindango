import { z } from 'zod';

export const CreateEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  startDate: z.coerce.date({ invalid_type_error: "Invalid start date" }),
  endDate: z.coerce.date({ invalid_type_error: "Invalid end date" }),
  commissionAssociation: z.number().min(0).max(100), // porcentaje
  commissionSeller: z.number().min(0).max(100),      // porcentaje
});
