import { z } from 'zod';
import { CreateSaleSchema } from '../schemas/create-sale.schema';

// El tipo base, solo con los campos que el usuario envía
export type CreateSaleInputBase = z.infer<typeof CreateSaleSchema>;

// El tipo interno, usado en el backend, incluye valueCharged
export type CreateSaleInput = CreateSaleInputBase & {
  valueCharged: number;
};