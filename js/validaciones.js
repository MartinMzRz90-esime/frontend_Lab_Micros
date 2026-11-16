/* ==========================================================
   validaciones.js - Lógica de validación de formularios
   Se carga antes de login.js y registro.js
   ========================================================== */

const Validaciones = {
  /** Boleta: exactamente 10 dígitos numéricos */
  boletaValida(boleta) {
    return /^\d{10}$/.test(boleta);
  },

  /** Folio de administrador: solo dígitos, al menos 1 */
  folioValido(folio) {
    return /^\d+$/.test(folio);
  },

  /** Correo institucional terminado en @alumno.ipn.mx */
  correoValido(correo) {
    return /^[^\s@]+@alumno\.ipn\.mx$/i.test(correo);
  },

  /** Contraseña: mínimo 8 caracteres */
  contrasenaValida(contrasena) {
    return typeof contrasena === "string" && contrasena.length >= 8;
  },

  /** Campo de texto obligatorio (no vacío) */
  requerido(valor) {
    return typeof valor === "string" && valor.trim().length > 0;
  },
};

/* ---------- Utilidades de interfaz compartidas ---------- */

/** Muestra el error de un campo (input + mensaje debajo) */
function mostrarError(idInput, mensaje) {
  const input = document.getElementById(idInput);
  const error = document.getElementById("error-" + idInput);
  if (input) input.classList.add("invalido");
  if (error) {
    error.textContent = mensaje;
    error.classList.add("visible");
  }
}

/** Limpia todos los errores de un formulario */
function limpiarErrores(form) {
  form.querySelectorAll(".invalido").forEach((el) => el.classList.remove("invalido"));
  form.querySelectorAll(".campo__error").forEach((el) => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}

/** Quita el error de un campo cuando el usuario vuelve a escribir */
function limpiarErrorAlEscribir(form) {
  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("invalido");
      const error = document.getElementById("error-" + input.id);
      if (error) {
        error.textContent = "";
        error.classList.remove("visible");
      }
    });
  });
}

/** Botones de ojo para mostrar/ocultar contraseña */
function activarToggleContrasena() {
  const ojoCerrado =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  const ojoAbierto =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';

  document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
    const input = document.getElementById(btn.dataset.togglePassword);
    btn.innerHTML = ojoCerrado;
    btn.addEventListener("click", () => {
      const visible = input.type === "text";
      input.type = visible ? "password" : "text";
      btn.innerHTML = visible ? ojoCerrado : ojoAbierto;
    });
  });
}

document.addEventListener("DOMContentLoaded", activarToggleContrasena);