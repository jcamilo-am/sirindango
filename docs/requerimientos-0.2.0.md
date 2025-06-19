# Requerimientos versión 0.2.0 – Backend Sirindango

## Objetivo general

Refactorizar y extender la lógica del sistema para garantizar la trazabilidad completa de productos, ventas y cambios. Preparar el backend para operaciones contables, generación de reportes y control de integridad de datos en ferias artesanales.

---

## Requerimientos técnicos

### 1. Trazabilidad de inventario

- [x] Crear entidad `InventoryMovement`.
- [x] Asociar cada venta con un movimiento de inventario tipo `SALIDA`.
- [x] Asociar cada carga inicial o cambio con movimiento tipo `ENTRADA`.
- [x] Bloquear ventas si no hay stock suficiente según movimientos.
- [x] Evitar eliminación de productos con movimientos registrados.

### 2. Gestión de cambios de productos

- [x] Crear entidad `ProductChange` vinculada a una venta.
- [x] Permitir devolver un producto y registrar uno nuevo como cambio.
- [x] Registrar movimientos asociados al cambio (entrada y salida).
- [x] Marcar la venta original como `CHANGED` si se reemplaza el producto completamente.
- [x] Registrar diferencia de valores y método de pago del excedente (efectivo o tarjeta).
- [x] Validar stock disponible para el nuevo producto antes del cambio.

### 3. Control de integridad y reglas de negocio

- [x] No permitir ventas, productos o cambios si el evento está `CLOSED`.
- [x] No permitir eliminar artesanos con productos o ventas asociadas.
- [x] No permitir modificar comisiones ni fechas de un evento si ya tiene ventas.
- [x] No permitir eliminar productos con ventas o movimientos.
- [x] Validar existencia de entidades antes de operar (venta, producto, evento, artesano).

### 4. Refactor técnico

- [x] Reestructurar DTOs y validaciones con Zod.
- [x] Aplicar transacciones Prisma en operaciones críticas (ventas, cambios).
- [x] Separar responsabilidades de servicios (ventas, stock, cambios, validadores).
- [x] Limpiar código obsoleto o acoplado.

### 5. Seguridad

- [x] Proteger todas las rutas con autenticación JWT.
- [x] Implementar decorador `@Public()` para rutas sin protección.
- [x] Crear guard global `JwtAuthGuard` configurado con `APP_GUARD`.
