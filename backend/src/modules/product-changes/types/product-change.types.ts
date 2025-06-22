import { z } from 'zod';
import { 
  CreateProductChangeSchema,
  GetProductChangeParamsSchema,
  ListProductChangesQuerySchema
} from '../schemas/product-change.schemas';

// Types for product change operations
export type CreateProductChangeInput = z.infer<typeof CreateProductChangeSchema>;
export type GetProductChangeParams = z.infer<typeof GetProductChangeParamsSchema>;
export type ListProductChangesQuery = z.infer<typeof ListProductChangesQuerySchema>;

// Types for internal calculations
export interface ProductChangeCalculation {
  deliveredProductPrice: number;
  valueDifference: number;
  isValidChange: boolean;
  errorMessage?: string;
}

// Types for validation responses
export interface ProductChangeValidation {
  isValid: boolean;
  errors: string[];
}

// Types for product change statistics
export interface ProductChangeStats {
  totalChanges: number;
  totalValueDifference: number;
  totalCardFees: number;
  changesByPaymentMethod: {
    cash: number;
    card: number;
  };
}
