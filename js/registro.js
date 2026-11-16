/* ==========================================================
   registro.js - Registro de alumnos
   Depende de: validaciones.js, api/apiClient.js
   ========================================================== */

(function () {
  const form = document.getElementById("form-registro");
  const btnEnviar = form.querySelector('button[type="submit"]');
  limpiarErrorAlEscribir(form);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    limpiarErrores(form);

    const datos = {
      apellidoPaterno: document.getElementById("apellido-paterno").value.trim(),
      apellidoMaterno: document.getElementById("apellido-materno").value.trim(),
      nombres: document.getElementById("nombres").value.trim(),
      boleta: document.getElementById("boleta").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      contrasena: document.getElementById("contrasena").value,
    };

    const errores = [];

    if (!Validaciones.requerido(datos.apellidoPaterno)) {
      errores.push("El apellido paterno es obligatorio.");
      mostrarError("apellido-paterno", "Campo obligatorio.");
    }
    if (!Validaciones.requerido(datos.apellidoMaterno)) {
      errores.push("El apellido materno es obligatorio.");
      mostrarError("apellido-materno", "Campo obligatorio.");
    }
    if (!Validaciones.requerido(datos.nombres)) {
      errores.push("El nombre es obligatorio.");
      mostrarError("nombres", "Campo obligatorio.");
    }
    if (!Validaciones.boletaValida(datos.boleta)) {
      errores.push("Número de boleta inválido: deben ser 10 dígitos.");
      mostrarError("boleta", "Número de boleta inválido (10 dígitos).");
    }
    if (!Validaciones.correoValido(datos.correo)) {
      errores.push("El correo debe terminar en @alumno.ipn.mx.");
      mostrarError("correo", "Debe terminar en @alumno.ipn.mx.");
    }
    if (!Validaciones.contrasenaValida(datos.contrasena)) {
      errores.push("La contraseña debe tener mínimo 8 caracteres.");
      mostrarError("contrasena", "Mínimo 8 caracteres.");
    }

    if (errores.length > 0) {
      alert("No se pudo crear la cuenta:\n\n- " + errores.join("\n- "));
      return;
    }

    btnEnviar.disabled = true;
    try {
      await ApiClient.registrarAlumno(datos);
      alert("¡Cuenta creada con éxito!");
      window.location.href = "alumno/carrito.html";
    } catch (err) {
      // Ej.: boleta duplicada (R 2.9)
      mostrarError("boleta", err.message);
      alert("No se pudo crear la cuenta:\n\n" + err.message);
    } finally {
      btnEnviar.disabled = false;
    }
  });
})();