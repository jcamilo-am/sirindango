import { z } from 'zod';
import { CreateSaleSchema } from '../schemas/create-sale.schema';

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;