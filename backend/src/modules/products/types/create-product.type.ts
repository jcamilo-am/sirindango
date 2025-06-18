import { z } from 'zod';
import { CreateProductSchema } from '../schemas/create-product.schema';

export type CreateProductInput = z.infer<typeof CreateProductSchema>;