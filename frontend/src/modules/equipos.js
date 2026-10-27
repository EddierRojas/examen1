import { request } from "./api.js";

// YA IMPLEMENTADO — listado de categorías
export const listarCategorias = () => request("/categorias");

/** TODO [F1] Todas las operaciones de equipos utilizan request(). */
export const listarEquipos = (pagina = 1, porPagina = 6) =>
  request(`/equipos?page=${encodeURIComponent(pagina)}&per_page=${encodeURIComponent(porPagina)}`);

export const crearEquipo = (datos) =>
  request("/equipos", { method: "POST", body: datos });

export const eliminarEquipo = (id) =>
  request(`/equipos/${encodeURIComponent(id)}`, { method: "DELETE" });
