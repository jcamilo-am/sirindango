export async function getProducts(params = {}) {
  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL || ''}/products`);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
}

export async function createProduct(data) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al crear producto');
  return res.json();
}

export async function updateProduct(id, data) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error al actualizar producto');
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar producto');
  return res.json();
}

export async function getEvents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/events`);
  if (!res.ok) throw new Error('Error al obtener eventos');
  return res.json();
}

export async function getArtisans() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/artisans`);
  if (!res.ok) throw new Error('Error al obtener artesanas');
  return res.json();
} 