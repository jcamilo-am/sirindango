import { createZodDto } from 'nestjs-zod'
import { CreateArtisanSchema } from '../schemas/create-artisan.schema';

export class CreateArtisanDto extends createZodDto(CreateArtisanSchema) {}
