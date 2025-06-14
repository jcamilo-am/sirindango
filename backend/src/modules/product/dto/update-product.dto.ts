import { createZodDto } from 'nestjs-zod';
import { UpdateProductSchema } from '../schemas/update-product.schema';

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}