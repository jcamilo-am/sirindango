import { IntegrationTestSetup } from './test-setup';

// Configuración global para todas las pruebas de integración
beforeAll(async () => {
  // Verificar que tenemos una BD de pruebas
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
    console.warn(
      '⚠️  DATABASE_URL debe contener "test" para pruebas de integración',
    );
    console.warn(
      '⚠️  Ejemplo: DATABASE_URL="postgresql://user:pass@localhost:5432/sirindango_test"',
    );
    process.exit(1);
  }
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  await IntegrationTestSetup.teardown();
});
