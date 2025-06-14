import { createZodDto } from 'nestjs-zod';
import { UpdateArtisanSchema } from '../schemas/update-artisan.schema';

export class UpdateArtisanDto extends createZodDto(UpdateArtisanSchema) {}