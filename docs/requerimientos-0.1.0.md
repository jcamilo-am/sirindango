# Requerimientos del Sistema: Plataforma para Ferias Artesanales

Este documento describe los requerimientos funcionales y no funcionales del sistema que gestionará eventos, productos y ventas de ferias artesanales indígenas.

---

## 1. Requerimientos Funcionales

### 1.1 Gestión de eventos

- **RF-01:** El sistema debe permitir registrar nuevos eventos, solicitando como campos obligatorios: nombre del evento (texto libre), lugar (texto libre), fecha de inicio (formato fecha), y fecha de finalización (formato fecha).
- **RF-02:** El sistema debe mostrar una lista cronológica de eventos activos y finalizados, diferenciando visualmente entre ambos.
- **RF-03:** El sistema debe permitir consultar eventos pasados, incluyendo sus productos registrados, ventas realizadas y resumen final.

### 1.2 Gestión de integrantes (artesanos)

- **RF-04:** El sistema debe permitir registrar integrantes con nombre completo, cédula o identificación, y estado activo/inactivo.
- **RF-05:** El sistema debe permitir visualizar los productos y ventas asociadas a cada integrante dentro de un evento específico.

### 1.3 Gestión de productos

- **RF-06:** El sistema debe permitir registrar productos asignados a un integrante específico dentro de un evento determinado. Cada producto debe tener como mínimo: nombre (texto), precio unitario (decimal mayor a cero), cantidad disponible (entero positivo), y categoría opcional.
- **RF-07:** El sistema debe validar que un producto solo puede ser eliminado o editado si no tiene ventas registradas.
- **RF-08:** El sistema debe mostrar los productos de un evento filtrables por integrante y ordenables por nombre o cantidad.

### 1.4 Gestión de ventas

- **RF-09:** El sistema debe permitir registrar una venta en un evento, indicando: producto vendido, cantidad vendida (entero), artesano responsable y fecha de la transacción.
- **RF-10:** El sistema debe validar que la cantidad vendida no supere la cantidad disponible del producto.
- **RF-11:** El sistema debe descontar automáticamente la cantidad vendida del stock del producto en tiempo real.
- **RF-12:** El sistema debe permitir ver el historial de ventas por evento y por integrante, con posibilidad de orden y búsqueda.

### 1.5 Resumen del evento

- **RF-13:** El sistema debe generar automáticamente un resumen final del evento, que incluya:
  - Total de productos registrados por integrante.
  - Total de productos vendidos por integrante.
  - Total recaudado por cada integrante.
  - Productos no vendidos (stock restante).
  - Recuento total por producto vendido.
- **RF-14:** El sistema debe mostrar el resumen de manera visual y comprensible, priorizando claridad y organización por integrante.

### 1.6 Usabilidad y navegación

- **RF-15:** El sistema debe permitir buscar eventos por nombre desde cualquier vista de navegación.
- **RF-16:** El sistema debe permitir filtrar productos por integrante dentro de la vista de productos de un evento.
- **RF-17:** El sistema debe mostrar mensajes de confirmación antes de eliminar registros y advertencias si algún campo obligatorio está vacío o contiene datos inválidos.
- **RF-18:** El sistema debe permitir volver fácilmente a la vista principal desde cualquier pantalla mediante una navegación clara.

---

## 2. Requerimientos No Funcionales

### 2.1 Calidad del sistema

- **RNF-01:** El sistema debe funcionar en entornos locales (sin conexión permanente a Internet), garantizando operación offline con persistencia en base de datos local.
- **RNF-02:** El tiempo de respuesta del sistema para registrar o consultar datos no debe exceder los 2 segundos bajo condiciones normales.
- **RNF-03:** El sistema debe prevenir errores comunes como campos vacíos, duplicados, cantidades inválidas o registros sin relaciones obligatorias.

### 2.2 Seguridad básica

- **RNF-04:** Todas las entradas de usuario deben ser validadas tanto en frontend como backend usando validadores como Zod y DTOs de NestJS.
- **RNF-05:** Aunque no se requiere autenticación, el sistema debe prevenir acciones destructivas involuntarias mediante confirmaciones explícitas.

### 2.3 Mantenibilidad y escalabilidad

- **RNF-06:** La aplicación debe estar estructurada en módulos separados por entidad (evento, producto, venta, integrante).
- **RNF-07:** La lógica de negocio debe residir en los servicios de NestJS, manteniendo controladores delgados.
- **RNF-08:** El código debe ser comentado adecuadamente y seguir convenciones de estilo de NestJS y TypeScript.
- **RNF-09:** El sistema debe permitir, a futuro, agregar funciones como exportación o visualización gráfica sin romper su estructura actual.

### 2.4 Accesibilidad y comprensión

- **RNF-10:** Todos los textos deben usar lenguaje cotidiano, sin tecnicismos, validado con personas con alfabetización digital básica.
- **RNF-11:** Las interfaces deben ser limpias, con botones visibles, etiquetas claras y navegación intuitiva.
- **RNF-12:** El sistema debe poder ser usado por personas sin formación técnica previa, incluyendo adultos mayores o usuarios rurales.

---

## Versión del documento

- Documento creado para el proyecto de grado **"Sistema para ferias artesanales indígenas"**.
- Última actualización: Junio de 2025.
