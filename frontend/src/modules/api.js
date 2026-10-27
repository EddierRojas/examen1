import { BASE_URL, TIEMPO_MAXIMO_MS } from "./config.js";
import { ErrorApi } from "./errores.js";
import { obtenerToken, olvidarSesion } from "./auth.js";

/** TODO [F1] Cliente HTTP único con autenticación, JSON y timeout. */
export const request = async (ruta, opciones = {}) => {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);

  const headers = new Headers(opciones.headers ?? {});
  headers.set("Accept", "application/json");

  const token = obtenerToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = opciones.body;
  if (body !== undefined && body !== null && typeof body === "object" &&
      !(body instanceof FormData) && !(body instanceof Blob)) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${ruta}`, {
      ...opciones,
      headers,
      body,
      signal: controlador.signal,
    });

    if (response.status === 204) return null;

    const datos = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        olvidarSesion();
        window.location.reload();
      }
      throw new ErrorApi(response.status, datos);
    }
    return datos;
  } finally {
    clearTimeout(temporizador);
  }
};
