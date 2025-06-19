import { z } from 'zod';
import { CreateInventoryMovementSchema } from '../schemas/create-inventory-movement.schema';

export type CreateInventoryMovementInput = z.infer<typeof CreateInventoryMovementSchema>;