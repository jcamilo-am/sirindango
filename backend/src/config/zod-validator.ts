import { z } from 'zod';

export function zodValidator<T extends z.ZodTypeAny>(schema: T) {
  return (config: Record<string, any>): z.infer<T> => {
    const result = schema.safeParse(config);
    if (!result.success) {
      console.error('Invalid environment variables:');
      console.error(result.error.format());
      throw new Error('Environment validation failed.');
    }
    return result.data;
  };
}
