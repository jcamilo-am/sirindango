import { z } from 'zod';
import { CreateArtisanSchema } from '../schemas/create-artisan.schema';

export type CreateArtisanInput = z.infer<typeof CreateArtisanSchema>;
