import { z } from 'zod';
import { UpdateProductSchema } from '../schemas/update-product.schema';

/**
 * Tipo inferido del schema de actualización de productos.
 * Usado internamente en el servicio para type safety.
 */
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
