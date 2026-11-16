/* ==========================================================
   admin.js - Lógica del portal del administrador
   Páginas: dashboard, inventario, prestamos, alumnos, devoluciones
   La página se detecta con <body data-pagina="...">
   Depende de: js/api/apiClient.js (ApiClient)
               js/validaciones.js (inventario.html y alumnos.html)
   NO usa mockData.js directamente.
   ========================================================== */

(function () {
  "use strict";

  /* ==========================================================
     UTILIDADES COMPARTIDAS
     ========================================================== */
  const $ = (id) => document.getElementById(id);

  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const SVG_ATTR = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  const ICONOS = {
    alumnos: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    inventario: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    prestamos: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><polyline points="9 14 11 16 15 12"/>',
    devoluciones: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  };
  const ICONO_ALERTA = `<svg ${SVG_ATTR}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

  const NAV = [
    { pagina: "alumnos",      href: "alumnos.html",      texto: "Control de alumnos" },
    { pagina: "inventario",   href: "inventario.html",   texto: "Gestión de inventario" },
    { pagina: "prestamos",    href: "prestamos.html",    texto: "Selección de préstamos" },
    { pagina: "devoluciones", href: "devoluciones.html", texto: "Devoluciones" },
  ];

  const COLOR_ESTADO = {
    Activa: "verde", Suspendida: "ambar", Bloqueada: "rojo",
    Pendiente: "ambar", Aceptado: "verde", Rechazado: "rojo",
    "En préstamo": "ambar", Vencido: "rojo", Devuelto: "verde",
    Disponible: "verde", "No disponible": "gris",
  };

  function crear(tag, clase, texto) {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function normalizar(texto) {
    return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /** "2026-11-05T11:30:00" -> "5 nov 2026 · 11:30 h" */
  function formatearFecha(iso) {
    const d = new Date(iso);
    const dos = (n) => String(n).padStart(2, "0");
    return d.getDate() + " " + MESES[d.getMonth()] + " " + d.getFullYear() +
      " · " + dos(d.getHours()) + ":" + dos(d.getMinutes()) + " h";
  }

  function moneda(n) {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
  }

  function badge(texto) {
    return crear("span", "badge badge--" + (COLOR_ESTADO[texto] || "gris"), texto);
  }

  function mostrarFallo(err) {
    alert(err && err.message ? err.message : "Ocurrió un error inesperado.");
  }

  /* ---------- Helpers de tabla ---------- */
  function td(label, ...contenido) {
    const celda = crear("td");
    celda.dataset.label = label;
    celda.append(...contenido);
    return celda;
  }

  function doble(titulo, sub) {
    const div = crear("div");
    div.appendChild(crear("span", "tabla__titulo", titulo));
    if (sub) div.appendChild(crear("span", "tabla__sub", sub));
    return div;
  }

  function estadoConDetalle(texto, detalle) {
    const div = crear("div");
    div.appendChild(badge(texto));
    if (detalle) div.appendChild(crear("span", "tabla__sub", detalle));
    return div;
  }

  function boton(texto, clase, alClic) {
    const b = crear("button", "btn btn--sm " + clase, texto);
    b.type = "button";
    b.addEventListener("click", alClic);
    return b;
  }

  function tdAcciones(...botones) {
    const celda = td("Acciones");
    celda.classList.add("celda-acciones");
    const caja = crear("div", "acciones");
    if (botones.length) caja.append(...botones);
    else caja.textContent = "—";
    celda.appendChild(caja);
    return celda;
  }

  /* ---------- Aviso (toast) ---------- */
  let temporizadorToast = null;
  function toast(mensaje) {
    let t = $("toast");
    if (!t) {
      t = crear("div", "toast");
      t.id = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = mensaje;
    t.classList.add("visible");
    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(() => t.classList.remove("visible"), 3200);
  }

  /* ---------- Modales ---------- */
  function abrirModal(modal) {
    modal.classList.add("abierto");
    const foco = modal.querySelector("[data-foco]");
    if (foco) foco.focus();
  }

  function cerrarModal(modal) {
    modal.classList.remove("abierto");
  }

  document.addEventListener("click", (e) => {
    const cierre = e.target.closest("[data-cerrar-modal]");
    if (cierre) {
      cerrarModal(cierre.closest(".modal"));
      return;
    }
    if (e.target.classList && e.target.classList.contains("modal")) cerrarModal(e.target);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal.abierto").forEach(cerrarModal);
  });

  /* ---------- Modal de confirmación reutilizable (R 5.8) ---------- */
  let accionPendiente = null;

  function crearModalConfirmacion() {
    const m = crear("div", "modal");
    m.id = "modal-confirmar";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.setAttribute("aria-labelledby", "mc-titulo");
    m.innerHTML =
      '<div class="modal__caja">' +
        '<span class="modal__icono modal__icono--alerta">' + ICONO_ALERTA + "</span>" +
        '<h2 id="mc-titulo" class="modal__titulo">Confirmar acción</h2>' +
        '<p id="mc-mensaje" class="modal__mensaje"></p>' +
        '<div class="modal__acciones">' +
          '<button type="button" class="btn btn--secundario" data-cerrar-modal>Cancelar</button>' +
          '<button type="button" id="mc-confirmar" class="btn btn--primario">Confirmar</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(m);

    $("mc-confirmar").addEventListener("click", () => {
      const accion = accionPendiente;
      accionPendiente = null;
      cerrarModal(m);
      if (accion) accion();
    });
  }

  /**
   * Muestra la alerta de confirmación; ejecuta alConfirmar() si el admin acepta.
   * opciones: { titulo, mensaje, textoConfirmar, peligro }
   */
  function confirmarAccion(opciones, alConfirmar) {
    $("mc-titulo").textContent = opciones.titulo || "Confirmar acción";
    $("mc-mensaje").textContent =
      opciones.mensaje ||
      "¿Estás seguro de que deseas continuar? Esta acción modificará el estado del pedido/alumno.";
    const btn = $("mc-confirmar");
    btn.textContent = opciones.textoConfirmar || "Confirmar";
    btn.className = "btn " + (opciones.peligro ? "btn--peligro" : "btn--primario");
    accionPendiente = alConfirmar;
    abrirModal($("modal-confirmar"));
  }

  /* ---------- Navegación y sesión ---------- */
  function renderNav() {
    const nav = $("nav-admin");
    if (!nav) return;
    const pagina = document.body.dataset.pagina;
    const ul = crear("ul", "nav-admin__lista");

    NAV.forEach((item) => {
      const li = crear("li");
      const a = crear("a", "nav-admin__enlace");
      a.href = item.href;
      a.innerHTML = "<svg " + SVG_ATTR + ' aria-hidden="true">' + ICONOS[item.pagina] + "</svg>";
      a.appendChild(crear("span", "", item.texto));
      if (item.pagina === pagina) {
        a.classList.add("activo");
        a.setAttribute("aria-current", "page");
      }
      li.appendChild(a);
      ul.appendChild(li);
    });
    nav.appendChild(ul);
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
     PÁGINA: dashboard.html
     ========================================================== */
  async function initDashboard() {
    const [admin, solicitudes, devoluciones, alumnos, inventario] = await Promise.all([
      ApiClient.obtenerAdminActual(),
      ApiClient.listarSolicitudes(),
      ApiClient.listarDevoluciones(),
      ApiClient.listarAlumnos(),
      ApiClient.listarInventario(),
    ]);

    $("admin-sesion").textContent = "Sesión activa: " + admin.nombreCompleto + " · Folio " + admin.folio;

    const disponibles = inventario.filter((m) => m.disponible).length;

    $("stat-pendientes").textContent = solicitudes.filter((s) => s.estado === "Pendiente").length;
    $("stat-por-devolver").textContent = devoluciones.filter((d) => d.estado !== "Devuelto").length;
    $("stat-sancionados").textContent = alumnos.filter((a) => a.estado !== "Activa").length;
    $("stat-disponibles").textContent = disponibles + " / " + inventario.length;
  }

  /* ==========================================================
     PÁGINA: inventario.html
     ========================================================== */
  async function initInventario() {
    const cuerpo = $("tabla-cuerpo");
    const buscador = $("buscador");
    const form = $("form-material");
    const modal = $("modal-material");
    let inventario = [];

    function render() {
      const f = normalizar(buscador.value.trim());
      const filas = inventario.filter((m) =>
        !f || [m.nombre, m.numeroSerie, m.descripcion, String(m.id)].some((c) => normalizar(c).includes(f))
      );

      cuerpo.innerHTML = "";
      filas.forEach((m) => {
        const tr = crear("tr");
        tr.append(
          td("Nombre", doble(m.nombre, m.descripcion)),
          td("ID", String(m.id)),
          td("Número de serie", m.numeroSerie),
          td("Disponible", badge(m.disponible ? "Disponible" : "No disponible")),
          td("Precio de reposición", moneda(m.precioReposicion))
        );
        cuerpo.appendChild(tr);
      });

      $("sin-resultados").hidden = filas.length > 0;
      $("contador").textContent = filas.length + " de " + inventario.length + " materiales";
    }

    async function cargar() {
      try {
        inventario = await ApiClient.listarInventario();
        render();
      } catch (err) {
        mostrarFallo(err);
      }
    }

    /* ---------- Registrar nuevo material ---------- */
    $("btn-nuevo").addEventListener("click", () => {
      form.reset();
      limpiarErrores(form);
      abrirModal(modal);
    });

    limpiarErrorAlEscribir(form);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      limpiarErrores(form);

      const nombre = $("mat-nombre").value.trim();
      const serie = $("mat-serie").value.trim();
      const descripcion = $("mat-descripcion").value.trim();
      const precio = $("mat-precio").value.trim();
      const foto = $("mat-foto").files[0];
      let valido = true;

      if (!Validaciones.requerido(nombre)) {
        mostrarError("mat-nombre", "Campo obligatorio.");
        valido = false;
      }

      if (!Validaciones.requerido(serie)) {
        mostrarError("mat-serie", "Campo obligatorio.");
        valido = false;
      } else if (inventario.some((m) => normalizar(m.numeroSerie) === normalizar(serie))) {
        mostrarError("mat-serie", "Ya existe un material con ese número de serie.");
        valido = false;
      }

      if (!Validaciones.requerido(descripcion)) {
        mostrarError("mat-descripcion", "Campo obligatorio.");
        valido = false;
      }

      const precioNum = Number(precio);
      if (!Validaciones.requerido(precio) || isNaN(precioNum) || precioNum <= 0) {
        mostrarError("mat-precio", "Ingresa un precio válido mayor a 0.");
        valido = false;
      }

      if (!valido) return;

      try {
        await ApiClient.registrarMaterial({
          nombre: nombre,
          numeroSerie: serie,
          descripcion: descripcion,
          precioReposicion: precioNum,
          foto: foto || null,
        });
        cerrarModal(modal);
        toast("Material registrado: " + nombre);
        await cargar();
      } catch (err) {
        mostrarFallo(err);
      }
    });

    buscador.addEventListener("input", render);
    await cargar();
  }

  /* ==========================================================
     PÁGINA: prestamos.html (solicitudes)
     ========================================================== */
  async function initPrestamos() {
    const cuerpo = $("tabla-cuerpo");
    const buscador = $("buscador");
    const ORDEN = { Pendiente: 0, Aceptado: 1, Rechazado: 2 };
    let solicitudes = [];

    function render() {
      const f = normalizar(buscador.value.trim());

      const filas = solicitudes
        .filter((s) =>
          !f ||
          [s.alumno, s.boleta, s.idPedido].some((c) => normalizar(c).includes(f)) ||
          s.materiales.some((m) => normalizar(m.nombre + " " + m.numeroSerie).includes(f))
        )
        .sort((a, b) =>
          ORDEN[a.estado] - ORDEN[b.estado] ||
          new Date(a.fechaSolicitud) - new Date(b.fechaSolicitud)
        );

      cuerpo.innerHTML = "";
      filas.forEach((s) => {
        const tr = crear("tr");

        const lista = crear("div", "celda-lista");
        s.materiales.forEach((m) => lista.appendChild(doble("1 × " + m.nombre, "Serie: " + m.numeroSerie)));

        let detalle = null;
        if (s.estado === "Aceptado" && s.fechaAceptacion) {
          detalle = "Folio " + s.folioAdminAcepta + " · " + formatearFecha(s.fechaAceptacion);
        }

        const pendiente = s.estado === "Pendiente";
        tr.append(
          td("Pedido", "#" + s.idPedido),
          td("Alumno", doble(s.alumno, "Boleta " + s.boleta)),
          td("Materiales", lista),
          td("Solicitud", doble(formatearFecha(s.fechaSolicitud), "Entrega: " + s.horarioEntrega)),
          td("Estado", estadoConDetalle(s.estado, detalle)),
          pendiente
            ? tdAcciones(
                boton("Rechazar", "btn--peligro-suave", () => resolver(s, "rechazar")),
                boton("Aceptar", "btn--primario", () => resolver(s, "aceptar"))
              )
            : tdAcciones()
        );
        cuerpo.appendChild(tr);
      });

      const pendientes = solicitudes.filter((s) => s.estado === "Pendiente").length;
      $("contador").textContent = pendientes + (pendientes === 1 ? " solicitud pendiente" : " solicitudes pendientes");
      $("sin-resultados").hidden = filas.length > 0;
    }

    async function cargar() {
      try {
        solicitudes = await ApiClient.listarSolicitudes();
        render();
      } catch (err) {
        mostrarFallo(err);
      }
    }

    function resolver(s, accion) {
      const aceptar = accion === "aceptar";

      confirmarAccion(
        {
          titulo: aceptar ? "Aceptar pedido" : "Rechazar pedido",
          mensaje: aceptar
            ? "¿Aceptar el pedido " + s.idPedido + " de " + s.alumno + "? Se registrará tu folio y la fecha y hora de aceptación."
            : "¿Rechazar el pedido " + s.idPedido + " de " + s.alumno + "? Los materiales reservados volverán a estar disponibles.",
          textoConfirmar: aceptar ? "Aceptar" : "Rechazar",
          peligro: !aceptar,
        },
        async () => {
          try {
            if (aceptar) await ApiClient.aceptarPedido(s.idPedido);
            else await ApiClient.rechazarPedido(s.idPedido);
            toast("Pedido " + s.idPedido + (aceptar ? " aceptado." : " rechazado."));
          } catch (err) {
            mostrarFallo(err);
          }
          await cargar();
        }
      );
    }

    buscador.addEventListener("input", render);
    await cargar();
  }

  /* ==========================================================
     PÁGINA: alumnos.html (directorio y sanciones)
     ========================================================== */
  async function initAlumnos() {
    const cuerpo = $("tabla-cuerpo");
    const buscador = $("buscador");
    const modal = $("modal-bloqueo");
    const form = $("form-bloqueo");
    const campoMotivo = $("bloqueo-motivo");
    let alumnos = [];
    let alumnoObjetivo = null;

    function render() {
      const f = normalizar(buscador.value.trim());

      const filas = alumnos
        .filter((a) => !f || [a.nombre, a.boleta, a.correo].some((c) => normalizar(c).includes(f)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")); // directorio alfabético

      cuerpo.innerHTML = "";
      filas.forEach((a) => {
        const tr = crear("tr");

        const detalle = a.estado === "Bloqueada" && a.motivoSancion ? "Motivo: " + a.motivoSancion : null;

        const botones = [];
        if (a.estado !== "Bloqueada") {
          botones.push(boton("Sancionar", "btn--peligro-suave", () => abrirSancion(a)));
        }
        if (a.estado !== "Activa") {
          botones.push(boton("Quitar sanciones", "btn--secundario", () => quitarSanciones(a)));
        }

        tr.append(
          td("Alumno", doble(a.nombre, a.correo)),
          td("Boleta", a.boleta),
          td("Estado", estadoConDetalle(a.estado, detalle)),
          tdAcciones(...botones)
        );
        cuerpo.appendChild(tr);
      });

      $("sin-resultados").hidden = filas.length > 0;
      $("contador").textContent = filas.length + " de " + alumnos.length + " alumnos";
    }

    async function cargar() {
      try {
        alumnos = await ApiClient.listarAlumnos();
        render();
      } catch (err) {
        mostrarFallo(err);
      }
    }

    /* ---------- Sancionar (motivo obligatorio) ---------- */
    function abrirSancion(alumno) {
      alumnoObjetivo = alumno;
      $("bloqueo-nombre").textContent = alumno.nombre;
      form.reset();
      limpiarErrores(form);
      abrirModal(modal);
    }

    campoMotivo.addEventListener("input", () => {
      campoMotivo.classList.remove("invalido");
      $("error-bloqueo-motivo").classList.remove("visible");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      limpiarErrores(form);

      const motivo = campoMotivo.value.trim();
      if (!Validaciones.requerido(motivo)) {
        mostrarError("bloqueo-motivo", "El motivo es obligatorio para aplicar un bloqueo.");
        return;
      }

      try {
        await ApiClient.bloquearAlumno(alumnoObjetivo.boleta, motivo);
        cerrarModal(modal);
        toast("Cuenta de " + alumnoObjetivo.nombre + " bloqueada.");
        await cargar();
      } catch (err) {
        mostrarFallo(err);
      }
    });

    /* ---------- Quitar sanciones ---------- */
    function quitarSanciones(alumno) {
      confirmarAccion(
        {
          titulo: "Quitar sanciones",
          mensaje:
            "¿Restaurar la cuenta de " + alumno.nombre + " a estado activo? " +
            "Esta acción no revierte un pedido ya marcado como vencido.",
          textoConfirmar: "Quitar sanciones",
        },
        async () => {
          try {
            await ApiClient.quitarSanciones(alumno.boleta);
            toast("Cuenta de " + alumno.nombre + " restaurada.");
          } catch (err) {
            mostrarFallo(err);
          }
          await cargar();
        }
      );
    }

    buscador.addEventListener("input", render);
    await cargar();
  }

  /* ==========================================================
     PÁGINA: devoluciones.html
     ========================================================== */
  async function initDevoluciones() {
    const cuerpo = $("tabla-cuerpo");
    const buscador = $("buscador");
    const ORDEN = { Vencido: 0, "En préstamo": 1, Devuelto: 2 };
    let devoluciones = [];

    function render() {
      const f = normalizar(buscador.value.trim());

      const filas = devoluciones
        .filter((d) =>
          !f || [d.material, d.numeroSerie, d.alumno, d.boleta, d.idPedido].some((c) => normalizar(c).includes(f))
        )
        .sort((a, b) =>
          ORDEN[a.estado] - ORDEN[b.estado] ||
          new Date(a.devolucionPrevista) - new Date(b.devolucionPrevista)
        );

      cuerpo.innerHTML = "";
      filas.forEach((d) => {
        const tr = crear("tr");
        const devuelto = d.estado === "Devuelto";

        tr.append(
          td("Material", doble(d.material, "Serie: " + d.numeroSerie)),
          td("Alumno", doble(d.alumno, "Boleta " + d.boleta)),
          td("Pedido", "#" + d.idPedido),
          td("Entrega", formatearFecha(d.fechaEntrega)),
          td("Devolución prevista", formatearFecha(d.devolucionPrevista)),
          td("Estado", estadoConDetalle(d.estado, devuelto && d.fechaDevolucion ? "Recibido: " + formatearFecha(d.fechaDevolucion) : null)),
          devuelto ? tdAcciones() : tdAcciones(boton("Marcar devolución", "btn--primario", () => marcarDevolucion(d)))
        );
        cuerpo.appendChild(tr);
      });

      const porDevolver = devoluciones.filter((d) => d.estado !== "Devuelto").length;
      $("contador").textContent = porDevolver + (porDevolver === 1 ? " pieza por devolver" : " piezas por devolver");
      $("sin-resultados").hidden = filas.length > 0;
    }

    async function cargar() {
      try {
        devoluciones = await ApiClient.listarDevoluciones();
        render();
      } catch (err) {
        mostrarFallo(err);
      }
    }

    function marcarDevolucion(d) {
      confirmarAccion(
        {
          titulo: "Registrar devolución",
          mensaje:
            "¿Confirmas que recibiste «" + d.material + "» (serie " + d.numeroSerie + ") de " + d.alumno + "?",
          textoConfirmar: "Confirmar devolución",
        },
        async () => {
          try {
            const r = await ApiClient.marcarDevolucion(d.idDetalle);
            toast(
              r && r.pedidoCompletado
                ? "Devolución registrada. Pedido " + d.idPedido + " completado."
                : "Devolución registrada."
            );
          } catch (err) {
            mostrarFallo(err);
          }
          await cargar();
        }
      );
    }

    buscador.addEventListener("input", render);
    await cargar();
  }

  /* ==========================================================
     INICIALIZACIÓN
     ========================================================== */
  document.addEventListener("DOMContentLoaded", async () => {
    renderNav();
    crearModalConfirmacion();
    iniciarCerrarSesion();

    const paginas = {
      dashboard: initDashboard,
      inventario: initInventario,
      prestamos: initPrestamos,
      alumnos: initAlumnos,
      devoluciones: initDevoluciones,
    };
    const iniciar = paginas[document.body.dataset.pagina];

    try {
      if (iniciar) await iniciar();
    } catch (err) {
      mostrarFallo(err);
    }
  });
})();