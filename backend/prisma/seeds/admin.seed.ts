import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';
import { envSchema } from '../../src/config/env.schema';

// Extendemos el schema para incluir ADMIN_PASSWORD
const seedEnvSchema = envSchema.extend({
  ADMIN_PASSWORD: z.string().min(8, 'La contraseña de admin debe tener al menos 8 caracteres'),
});

// Validamos las variables de entorno
const env = seedEnvSchema.parse(process.env);

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

  const existing = await prisma.user.findUnique({ where: { username: 'admin' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        username: 'admin',
        password,
        role: 'admin',
      },
    });
    console.log('Usuario admin creado');
  } else {
    console.log('El usuario admin ya existe');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });