/**
 * Opciones de filtrado para la búsqueda de productos.
 * Permite filtrar por evento, artesano y ordenar por diferentes criterios.
 */
export type FindAllOptions = {
  eventId?: number;
  artisanId?: number;
  order?: 'name' | 'quantity';
};
