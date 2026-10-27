import { crearEquipo, listarCategorias } from "../modules/equipos.js";
import { mostrarMensaje } from "./mensajes.js";

const $form = document.querySelector("#form-equipo");
const $selectCategoria = document.querySelector("#categoria_id");
const $btnGuardar = document.querySelector("#btn-guardar");

/** TODO [F3] Cargar categorías, guardar y mostrar errores junto al campo. */
export const iniciarFormulario = ({ alGuardar }) => {
  listarCategorias()
    .then(({ data }) => {
      $selectCategoria.querySelectorAll("option:not(:first-child)").forEach((opcion) => opcion.remove());
      for (const categoria of data) {
        const opcion = document.createElement("option");
        opcion.value = categoria.id;
        opcion.textContent = categoria.nombre;
        $selectCategoria.append(opcion);
      }
    })
    .catch((error) => mostrarMensaje("error", error.message ?? "No se pudieron cargar las categorías."));

  $form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    $form.querySelectorAll("[data-error]").forEach((elemento) => {
      elemento.textContent = "";
    });
    $form.querySelectorAll("[aria-invalid]").forEach((elemento) => {
      elemento.removeAttribute("aria-invalid");
    });

    const datos = Object.fromEntries(new FormData($form));
    datos.categoria_id = Number(datos.categoria_id);
    datos.costo_interno = Number(datos.costo_interno);

    const textoOriginal = $btnGuardar.textContent;
    $btnGuardar.disabled = true;
    $btnGuardar.textContent = "Guardando…";

    try {
      const resultado = await crearEquipo(datos);
      $form.reset();
      mostrarMensaje("exito", `Equipo ${resultado.data.codigo} registrado.`);
      await alGuardar();
    } catch (error) {
      if (error.status === 422) {
        for (const [campo, mensajes] of Object.entries(error.datos?.errors ?? {})) {
          const campoError = $form.querySelector(`[data-error="${campo}"]`);
          const entrada = $form.elements.namedItem(campo);
          if (campoError) campoError.textContent = mensajes[0] ?? "";
          if (entrada) entrada.setAttribute("aria-invalid", "true");
        }
      } else {
        mostrarMensaje("error", error.message ?? "No fue posible registrar el equipo.");
      }
    } finally {
      $btnGuardar.disabled = false;
      $btnGuardar.textContent = textoOriginal;
    }
  });
};
