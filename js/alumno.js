/* ==========================================================
   alumno.js - Lógica del portal del alumno
   Páginas: carrito.html, perfil.html, prestamos.html
   Depende de: js/api/apiClient.js (ApiClient)
               js/validaciones.js (solo en perfil.html)
   NO usa mockData.js directamente.
   ========================================================== */

(function () {
  "use strict";

  /* ==========================================================
     UTILIDADES COMPARTIDAS
     ========================================================== */
  const $ = (id) => document.getElementById(id);

  const SVG_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const ICONOS = {
    pausa: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="10"/><line x1="10" y1="9" x2="10" y2="15"/><line x1="14" y1="9" x2="14" y2="15"/></svg>`,
    candado: `<svg ${SVG_ATTR}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    check: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="10"/><polyline points="8 12 11 15 16 9"/></svg>`,
    info: `<svg ${SVG_ATTR}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const ESTADOS = {
    Activa: { clase: "badge--activa" },
    Suspendida: {
      clase: "badge--suspendida",
      icono: ICONOS.pausa,
      titulo: "Tu cuenta está suspendida",
      mensaje: "Estás suspendido. No puedes solicitar materiales mientras tu cuenta permanezca en este estado.",
      mostrarCausa: false,
    },
    Bloqueada: {
      clase: "badge--bloqueada",
      icono: ICONOS.candado,
      titulo: "Tu cuenta está bloqueada",
      mensaje: "Estás bloqueado. No puedes solicitar materiales. Consulta con el administrador para revisar tu caso.",
      mostrarCausa: true,
    },
  };

  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function crear(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function normalizar(texto) {
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /** "2026-10-22T08:35:00" -> "22 oct 2026 · 08:35 h" */
  function formatearFecha(iso) {
    const d = new Date(iso);
    const dos = (n) => String(n).padStart(2, "0");
    return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear() +
      " · " + dos(d.getHours()) + ":" + dos(d.getMinutes()) + " h";
  }

  /** Pinta el badge de estado (Activa / Suspendida / Bloqueada) */
  function pintarBadge(el, estado) {
    const cfg = ESTADOS[estado] || ESTADOS.Suspendida;
    el.textContent = estado;
    el.className = "badge " + cfg.clase;
  }

  function mostrarFallo(err) {
    alert(err && err.message ? err.message : "Ocurrió un error inesperado.");
  }

  function abrirModal(modal) {
    modal.classList.add("abierto");
  }
  function cerrarModal(modal) {
    modal.classList.remove("abierto");
  }

  function enlazarCierreModal(modal, ids) {
    ids.forEach((id) => $(id).addEventListener("click", () => cerrarModal(modal)));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) cerrarModal(modal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") cerrarModal(modal);
    });
  }

  function iniciarCerrarSesion() {
    const btn = $("btn-cerrar-sesion");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      await ApiClient.cerrarSesion();
      window.location.href = "../index.html";
    });
  }

  /* ==========================================================
     PÁGINA: carrito.html
     ========================================================== */
  async function initCarrito() {
    const LIMITE_TOTAL = 8;   // máximo de piezas por pedido
    const LIMITE_IGUALES = 4; // máximo de piezas iguales por pedido

    const refs = {
      estado: $("estado-cuenta"),
      buscador: $("buscador"),
      lista: $("lista-materiales"),
      sinResultados: $("sin-resultados"),
      contador: $("contador-carrito"),
      fecha: $("fecha-entrega"),
      horarios: $("lista-horarios"),
      btnConfirmar: $("btn-confirmar"),
      resumen: $("resumen-pedido"),
      modal: $("modal-cuenta"),
      modalIcono: $("modal-icono"),
      modalTitulo: $("modal-titulo"),
      modalMensaje: $("modal-mensaje"),
      modalCausa: $("modal-causa"),
      modalCausaTexto: $("modal-causa-texto"),
    };

    // Datos que llegan desde ApiClient
    const [perfil, horarios] = await Promise.all([ApiClient.obtenerPerfil(), ApiClient.listarHorarios()]);
    let materiales = await ApiClient.listarMateriales();

    const carrito = new Set(); // ids de materiales seleccionados
    let horarioId = null;
    const cuentaActiva = perfil.estado === "Activa";

    function cuantosIguales(nombre) {
      return materiales.filter((m) => carrito.has(m.id) && m.nombre === nombre).length;
    }

    /* ---------- Modal de cuenta suspendida / bloqueada ---------- */
    function abrirModalCuenta() {
      const cfg = ESTADOS[perfil.estado] || ESTADOS.Suspendida;
      refs.modalIcono.innerHTML = cfg.icono || ICONOS.pausa;
      refs.modalTitulo.textContent = cfg.titulo || "Tu cuenta tiene restricciones";
      refs.modalMensaje.textContent =
        cfg.mensaje || "No puedes solicitar materiales mientras tu cuenta permanezca en este estado.";

      if (cfg.mostrarCausa && perfil.motivoSancion) {
        refs.modalCausaTexto.textContent = perfil.motivoSancion;
        refs.modalCausa.hidden = false;
      } else {
        refs.modalCausa.hidden = true;
      }

      abrirModal(refs.modal);
      $("modal-entendido").focus();
    }

    /* ---------- Catálogo ---------- */
    function pintarBoton(boton, enCarro) {
      boton.setAttribute("aria-pressed", String(enCarro));
      boton.querySelector(".btn-carro__texto").textContent = enCarro ? "En tu carro" : "Añadir al carrito";
    }

    function alternarCarrito(id) {
      const material = materiales.find((m) => m.id === id);
      if (!material || !material.disponible) return false;

      if (carrito.has(id)) {
        carrito.delete(id);
      } else {
        if (carrito.size >= LIMITE_TOTAL) {
          alert("Solo puedes solicitar un máximo de " + LIMITE_TOTAL + " piezas por pedido.");
          return false;
        }
        if (cuantosIguales(material.nombre) >= LIMITE_IGUALES) {
          alert("Solo puedes solicitar un máximo de " + LIMITE_IGUALES + " piezas iguales por pedido.");
          return false;
        }
        carrito.add(id);
      }

      actualizarResumen();
      return true;
    }

    function crearTarjeta(m) {
      const tarjeta = crear("article", "material" + (m.disponible ? "" : " material--agotado"));

      const fila = crear("div", "material__fila");
      const foto = crear("div", "material__foto");
      const img = document.createElement("img");
      img.src = m.imagen;
      img.alt = m.nombre + " " + m.modelo;
      img.addEventListener("error", () => img.remove());
      foto.appendChild(img);

      const info = crear("div", "material__info");
      info.appendChild(crear("h3", "material__nombre", m.nombre));
      info.appendChild(crear("p", "material__modelo", m.modelo));
      info.appendChild(crear("p", "material__etiqueta", "Número de serie"));
      info.appendChild(crear("p", "material__serie", m.numeroSerie));
      fila.append(foto, info);

      const pie = crear("div", "material__pie");
      const boton = crear("button", "btn-carro");
      boton.type = "button";
      boton.appendChild(crear("span", "btn-carro__check"));
      boton.appendChild(crear("span", "btn-carro__texto"));

      if (m.disponible) {
        pintarBoton(boton, carrito.has(m.id));
        boton.addEventListener("click", () => {
          if (alternarCarrito(m.id)) pintarBoton(boton, carrito.has(m.id));
        });
      } else {
        boton.disabled = true;
        boton.setAttribute("aria-pressed", "false");
        boton.querySelector(".btn-carro__texto").textContent = "No disponible";
      }

      pie.append(boton, crear("span", "material__cantidad", "Cantidad: 1"));
      tarjeta.append(fila, pie);
      return tarjeta;
    }

    function renderMateriales() {
      const filtro = normalizar(refs.buscador.value.trim());
      const visibles = materiales.filter((m) => {
        if (!filtro) return true;
        return [m.nombre, m.modelo, m.numeroSerie].some((campo) => normalizar(campo).includes(filtro));
      });

      refs.lista.innerHTML = "";
      visibles.forEach((m) => refs.lista.appendChild(crearTarjeta(m)));
      refs.sinResultados.hidden = visibles.length > 0;
    }

    /* ---------- Horarios ---------- */
    function renderFecha() {
      let texto = new Date().toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      texto = texto.replace(",", "");
      refs.fecha.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function renderHorarios() {
      refs.horarios.innerHTML = "";
      horarioId = horarios.length ? horarios[0].id : null;

      horarios.forEach((h, i) => {
        const etiqueta = crear("label", "horario");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "horario";
        radio.value = h.id;
        radio.checked = i === 0;
        radio.addEventListener("change", () => {
          horarioId = h.id;
          actualizarResumen();
        });
        etiqueta.append(radio, crear("span", "", h.etiqueta));
        refs.horarios.appendChild(etiqueta);
      });
    }

    /* ---------- Resumen y confirmación ---------- */
    function actualizarResumen() {
      const n = carrito.size;
      refs.contador.textContent = n + (n === 1 ? " seleccionado" : " seleccionados");

      const horario = horarios.find((h) => h.id === horarioId);

      if (!cuentaActiva) {
        refs.btnConfirmar.disabled = true;
        refs.resumen.textContent = "No puedes confirmar pedidos con tu cuenta restringida.";
        return;
      }

      refs.btnConfirmar.disabled = n === 0 || !horario;
      refs.resumen.textContent =
        n === 0 || !horario
          ? "Agrega materiales y elige un horario para continuar."
          : n + (n === 1 ? " material" : " materiales") + " · Entrega de " + horario.etiqueta;
    }

    async function confirmarPedido() {
      if (!cuentaActiva || carrito.size === 0 || !horarioId) return;

      const horario = horarios.find((h) => h.id === horarioId);
      refs.btnConfirmar.disabled = true;

      try {
        await ApiClient.crearPedido({ materiales: Array.from(carrito), horarioId: horarioId });

        alert(
          "¡Pedido enviado con éxito!\n" +
            "Materiales: " + carrito.size + "\n" +
            "Entrega: " + horario.etiqueta
        );
        carrito.clear();
      } catch (err) {
        alert("No se pudo enviar el pedido:\n\n" + err.message);
      }

      // Refresca el catálogo con el estado real de disponibilidad
      try {
        materiales = await ApiClient.listarMateriales();
      } catch (err) {
        mostrarFallo(err);
      }
      renderMateriales();
      actualizarResumen();
    }

    /* ---------- Inicialización ---------- */
    pintarBadge(refs.estado, perfil.estado);
    renderFecha();
    renderMateriales();
    renderHorarios();
    actualizarResumen();

    refs.buscador.addEventListener("input", renderMateriales);
    refs.btnConfirmar.addEventListener("click", confirmarPedido);
    enlazarCierreModal(refs.modal, ["modal-entendido", "modal-cerrar"]);

    // El modal aparece si la cuenta NO está activa
    if (perfil.estado !== "Activa") abrirModalCuenta();
  }

  /* ==========================================================
     PÁGINA: perfil.html
     ========================================================== */
  async function initPerfil() {
    const form = $("form-perfil");
    const inputNombre = $("nombre");
    const inputBoleta = $("boleta");
    const inputCorreo = $("correo");
    const modal = $("modal-estado");
    const btnRazon = $("me-btn-razon");
    const causa = $("me-causa");

    const MOTIVO_SUSPENSION =
      "Tu cuenta fue suspendida automáticamente por no devolver el equipo antes de la hora máxima de entrega.";

    let perfil = await ApiClient.obtenerPerfil();

    /* ---------- Llenado de datos ---------- */
    inputNombre.value = perfil.nombreCompleto;
    inputBoleta.value = perfil.boleta;
    inputCorreo.value = perfil.correo;
    pintarBadge($("estado-cuenta"), perfil.estado);
    limpiarErrorAlEscribir(form);

    /* ---------- Modal informativo de estado ---------- */
    function abrirModalEstado() {
      const estado = perfil.estado;
      const cfg = ESTADOS[estado] || ESTADOS.Suspendida;
      const activa = estado === "Activa";

      $("me-icono").innerHTML = activa ? ICONOS.check : cfg.icono || ICONOS.pausa;
      $("me-titulo").textContent = activa ? "Estado de la cuenta" : cfg.titulo;
      $("me-mensaje").textContent = activa
        ? "No estás suspendido o bloqueado."
        : "Tu cuenta está " + estado.toLowerCase() + ". Consulta el motivo para conocer más detalles.";
      pintarBadge($("me-badge"), estado);

      btnRazon.hidden = activa;
      causa.hidden = true;

      abrirModal(modal);
      $("me-entendido").focus();
    }

    btnRazon.addEventListener("click", () => {
      const motivo =
        perfil.motivoSancion ||
        (perfil.estado === "Suspendida" ? MOTIVO_SUSPENSION : "Sin motivo registrado.");
      $("me-causa-texto").textContent = motivo;
      causa.hidden = false;
    });

    $("btn-estado-cuenta").addEventListener("click", abrirModalEstado);
    enlazarCierreModal(modal, ["me-entendido", "me-cerrar"]);

    /* ---------- Guardar cambios ---------- */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      limpiarErrores(form);

      const nombre = inputNombre.value.trim();
      const correo = inputCorreo.value.trim();
      const errores = [];

      if (!Validaciones.requerido(nombre)) {
        errores.push("El nombre es obligatorio.");
        mostrarError("nombre", "Campo obligatorio.");
      }
      if (!Validaciones.correoValido(correo)) {
        errores.push("El correo debe terminar en @alumno.ipn.mx.");
        mostrarError("correo", "Debe terminar en @alumno.ipn.mx.");
      }

      if (errores.length > 0) {
        alert("No se pudieron guardar los cambios:\n\n- " + errores.join("\n- "));
        return;
      }

      try {
        perfil = await ApiClient.actualizarPerfil({ nombreCompleto: nombre, correo: correo });
        alert("¡Datos actualizados con éxito!");
      } catch (err) {
        alert("No se pudieron guardar los cambios:\n\n" + err.message);
      }
    });
  }

  /* ==========================================================
     PÁGINA: prestamos.html
     Vistas: ?vista=actual (por defecto) | ?vista=historial
     ========================================================== */
  async function initPrestamos() {
    const contenedor = $("contenido-prestamos");
    const vista = new URLSearchParams(window.location.search).get("vista") === "historial" ? "historial" : "actual";

    document.querySelectorAll("[data-vista]").forEach((enlace) => {
      const activo = enlace.dataset.vista === vista;
      enlace.classList.toggle("activo", activo);
      if (activo) enlace.setAttribute("aria-current", "page");
      else enlace.removeAttribute("aria-current");
    });

    function fila(etiqueta, valor) {
      const div = crear("div", "registro__fila");
      div.append(crear("dt", "", etiqueta), crear("dd", "", valor));
      return div;
    }

    /* ---------- Préstamo actual ---------- */
    async function renderActual() {
      const p = await ApiClient.obtenerPrestamoActual();
      contenedor.innerHTML = "";

      if (!p) {
        contenedor.appendChild(crear("p", "vacio", "No tienes préstamos activos por el momento."));
        return;
      }

      const encabezado = crear("div", "prestamo__encabezado");
      encabezado.appendChild(crear("h2", "", "Préstamo actual"));
      encabezado.appendChild(crear("span", "badge badge--activa", p.estado));

      const tarjeta = crear("article", "prestamo");

      p.materiales.forEach((m) => {
        const bloque = crear("div", "prestamo__material");

        const foto = crear("div", "material__foto");
        const img = document.createElement("img");
        img.src = m.imagen;
        img.alt = m.nombre + " " + m.modelo;
        img.addEventListener("error", () => img.remove());
        foto.appendChild(img);

        const info = crear("div", "material__info");
        info.appendChild(crear("h3", "material__nombre", m.nombre));
        info.appendChild(crear("p", "material__modelo", m.modelo));
        info.appendChild(crear("p", "prestamo__serie", "Número de serie: " + m.numeroSerie));

        bloque.append(foto, info);
        tarjeta.appendChild(bloque);
      });

      const n = p.materiales.length;
      const detalle = crear("dl", "detalle");
      [
        ["Equipos en préstamo", n + (n === 1 ? " equipo" : " equipos")],
        ["Identificador de pedido", p.idPedido],
        ["Fecha y hora del pedido", formatearFecha(p.fechaPedido)],
        ["Fecha y hora de entrega", formatearFecha(p.fechaEntrega)],
        ["Devolución prevista", formatearFecha(p.devolucionPrevista)],
      ].forEach(([etiqueta, valor]) => {
        detalle.append(crear("dt", "", etiqueta), crear("dd", "", valor));
      });
      tarjeta.appendChild(detalle);

      const nota = crear("div", "nota-info");
      nota.innerHTML = ICONOS.info;
      nota.appendChild(crear("span", "", "Al devolver el equipo, podrás consultar el registro completo en Historial."));

      contenedor.append(encabezado, tarjeta, nota);
    }

    /* ---------- Historial ---------- */
    async function renderHistorial() {
      const historial = await ApiClient.obtenerHistorial();
      contenedor.innerHTML = "";

      const registros = historial
        .slice()
        .sort((a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)); // más recientes primero

      if (registros.length === 0) {
        contenedor.appendChild(crear("p", "vacio", "Aún no tienes materiales en tu historial."));
        return;
      }

      const resumen = crear("div", "historial__resumen");
      const total = registros.length;
      resumen.appendChild(crear("strong", "", total + (total === 1 ? " material prestado" : " materiales prestados")));
      resumen.appendChild(crear("span", "historial__orden", "Más recientes primero"));
      contenedor.appendChild(resumen);

      registros.forEach((r) => {
        const dl = crear("dl", "registro");
        dl.append(
          fila("Número de serie", r.numeroSerie),
          fila("Nombre", r.nombre + " · " + r.modelo),
          fila("Identificador de pedido", r.idPedido),
          fila("Fecha y hora del pedido", formatearFecha(r.fechaPedido)),
          fila("Fecha y hora de la devolución", r.fechaDevolucion ? formatearFecha(r.fechaDevolucion) : "Pendiente · En préstamo")
        );
        contenedor.appendChild(dl);
      });

      contenedor.appendChild(crear("p", "historial__pie", "Se muestran todos los registros."));
    }

    if (vista === "historial") {
      document.title = "Historial | IPN - Portal del alumno";
      $("titulo-prestamos").textContent = "Historial";
      $("subtitulo-prestamos").textContent = "Consulta los materiales que has solicitado y sus fechas de devolución.";
      await renderHistorial();
    } else {
      await renderActual();
    }
  }

  /* ==========================================================
     INICIALIZACIÓN: detecta la página por sus elementos
     ========================================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    iniciarCerrarSesion();

    try {
      if ($("lista-materiales")) await initCarrito();
      if ($("form-perfil")) await initPerfil();
      if ($("contenido-prestamos")) await initPrestamos();
    } catch (err) {
      mostrarFallo(err);
    }
  });
})();