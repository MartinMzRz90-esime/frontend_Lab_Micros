/* ==========================================================
   login.js - Inicio de sesión
   Depende de: validaciones.js, api/apiClient.js
   ========================================================== */

(function () {
  const form = document.getElementById("form-login");
  const btnEnviar = form.querySelector('button[type="submit"]');
  limpiarErrorAlEscribir(form);

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    limpiarErrores(form);

    const boleta = document.getElementById("boleta").value.trim();
    const folio = document.getElementById("folio").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    const errores = [];

    // Campo dual: solo uno de los dos identificadores
    if (!boleta && !folio) {
      errores.push("Ingresa tu boleta (alumno) o tu folio (administrador).");
      mostrarError("boleta", "Ingresa tu boleta o tu folio.");
    } else if (boleta && folio) {
      errores.push("Completa solo un identificador: boleta o folio.");
      mostrarError("boleta", "Completa solo un identificador.");
      mostrarError("folio", "Completa solo un identificador.");
    } else if (boleta && !Validaciones.boletaValida(boleta)) {
      errores.push("La boleta debe tener exactamente 10 dígitos.");
      mostrarError("boleta", "La boleta debe tener 10 dígitos numéricos.");
    } else if (folio && !Validaciones.folioValido(folio)) {
      errores.push("El folio debe contener solo números.");
      mostrarError("folio", "El folio debe contener solo números.");
    }

    if (!Validaciones.contrasenaValida(contrasena)) {
      errores.push("La contraseña debe tener mínimo 8 caracteres.");
      mostrarError("contrasena", "Mínimo 8 caracteres.");
    }

    if (errores.length > 0) {
      alert("Error al iniciar sesión:\n\n- " + errores.join("\n- "));
      return;
    }

    btnEnviar.disabled = true;
    try {
      const sesion = await ApiClient.login({
        rol: boleta ? "alumno" : "administrador",
        identificador: boleta || folio,
        contrasena: contrasena,
      });

      alert("¡Inicio de sesión exitoso!\nRol: " + sesion.rol);
      window.location.href = sesion.rol === "administrador" ? "admin/dashboard.html" : "alumno/carrito.html";
    } catch (err) {
      alert("No se pudo iniciar sesión:\n\n" + err.message);
    } finally {
      btnEnviar.disabled = false;
    }
  });
})();