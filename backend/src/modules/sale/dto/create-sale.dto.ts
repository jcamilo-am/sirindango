import { createZodDto } from 'nestjs-zod';
import { CreateSaleSchema } from '../schemas/create-sale.schema';

export class CreateSaleDto extends createZodDto(CreateSaleSchema) {}