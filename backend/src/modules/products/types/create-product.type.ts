import { z } from 'zod';
import { CreateProductSchema } from '../schemas/create-product.schema';

/**
 * Tipo inferido del schema de creación de productos.
 * Usado internamente en el servicio para type safety.
 */
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
