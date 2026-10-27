import { listarEquipos, eliminarEquipo } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const POR_PAGINA = 6;

const $lista = document.querySelector("#lista-equipos");
const $plantilla = document.querySelector("#tpl-equipo");
const $resumen = document.querySelector("#resumen");
const $paginaActual = document.querySelector("#pagina-actual");
const $btnAnterior = document.querySelector("#btn-anterior");
const $btnSiguiente = document.querySelector("#btn-siguiente");

let paginaActual = 1;
let ultimaPagina = 1;

export const formatearFecha = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("es-CR", { day: "numeric", month: "short", year: "numeric" });

/** TODO [F2] Renderizar tarjetas y controles de paginación. */
export const cargarPagina = async (pagina = 1) => {
  $lista.setAttribute("aria-busy", "true");
  $btnAnterior.disabled = true;
  $btnSiguiente.disabled = true;

  try {
    const resultado = await listarEquipos(pagina, POR_PAGINA);
    const { data: equipos, meta } = resultado;
    paginaActual = meta.current_page;
    ultimaPagina = Math.max(1, meta.last_page);

    $lista.replaceChildren();
    for (const equipo of equipos) {
      const copia = $plantilla.content.cloneNode(true);
      const tarjeta = copia.querySelector("li");
      tarjeta.dataset.id = equipo.id;
      copia.querySelector(".codigo").textContent = equipo.codigo;
      copia.querySelector(".nombre").textContent = equipo.nombre;
      copia.querySelector(".categoria").textContent = equipo.categoria?.nombre ?? "Sin categoría";
      copia.querySelector(".fecha").textContent = formatearFecha(equipo.fecha_adquisicion);
      const estado = copia.querySelector(".estado");
      estado.textContent = equipo.estado;
      estado.dataset.estado = equipo.estado;
      $lista.append(copia);
    }

    if (!equipos.length) {
      const vacio = document.createElement("li");
      vacio.className = "vacio";
      vacio.textContent = "No hay equipos registrados.";
      $lista.append(vacio);
    }

    $resumen.textContent = equipos.length
      ? `Mostrando ${meta.from}–${meta.to} de ${meta.total}`
      : "Mostrando 0 de 0";
    $paginaActual.textContent = `Página ${paginaActual} de ${ultimaPagina}`;
  } catch (error) {
    mostrarMensaje("error", error.message ?? "No se pudo cargar el inventario.");
  } finally {
    $lista.setAttribute("aria-busy", "false");
    $btnAnterior.disabled = paginaActual <= 1;
    $btnSiguiente.disabled = paginaActual >= ultimaPagina;
  }
};

/** TODO [F4] Un único listener en la lista permite eliminar cualquier tarjeta. */
const alHacerClicEnLista = async (evento) => {
  const boton = evento.target.closest(".btn-eliminar");
  if (!boton || !$lista.contains(boton)) return;

  const tarjeta = boton.closest("li[data-id]");
  if (!tarjeta || !window.confirm("¿Desea eliminar este equipo?")) return;

  boton.disabled = true;
  try {
    await eliminarEquipo(tarjeta.dataset.id);
    mostrarMensaje("exito", "Equipo eliminado.");
    const eraUltimo = $lista.querySelectorAll("li[data-id]").length === 1;
    await cargarPagina(eraUltimo && paginaActual > 1 ? paginaActual - 1 : paginaActual);
  } catch (error) {
    if (error.status === 409) {
      mostrarMensaje("error", error.datos?.mensaje ?? error.message);
    } else {
      mostrarMensaje("error", "No fue posible eliminar el equipo.");
    }
  } finally {
    boton.disabled = false;
  }
};

export const iniciarListado = () => {
  $lista.addEventListener("click", alHacerClicEnLista);
  $btnAnterior.addEventListener("click", () => {
    if (paginaActual > 1) cargarPagina(paginaActual - 1);
  });
  $btnSiguiente.addEventListener("click", () => {
    if (paginaActual < ultimaPagina) cargarPagina(paginaActual + 1);
  });
  cargarPagina(1);
};
