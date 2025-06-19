import { z } from 'zod';
import { CreateProductChangeSchema } from '../schemas/create-product-change.schema';

export type CreateProductChangeInput = z.infer<typeof CreateProductChangeSchema>;