/* ==========================================================
   apiClient.js - ÚNICA puerta de entrada a los datos
   ----------------------------------------------------------
   El resto del frontend (login.js, registro.js, alumno.js,
   admin.js) solo usa el objeto global ApiClient.
   Todas las funciones devuelven Promesas (async), igual que
   lo harán las llamadas reales con fetch.

   PARA INTEGRAR CON EL BACKEND:
     1. Cambia CONFIG.MODO_MOCK a false.
     2. Ajusta CONFIG.API_BASE_URL.
     3. Ajusta las rutas y los nombres de campos de la sección
        "IMPLEMENTACIÓN REAL" según lo que definan tus compañeros.
   Carga requerida (en este orden):
     js/api/mockData.js  ->  js/api/apiClient.js  ->  tu script
   ========================================================== */

(function () {
  "use strict";

  const CONFIG = {
    MODO_MOCK: true,                           // <--- EL INTERRUPTOR
    API_BASE_URL: "http://localhost:8000/api", // <--- URL del backend (Python)
    LATENCIA_MS: 150,                          // retardo simulado en modo mock
  };

  /* ==========================================================
     UTILIDADES
     ========================================================== */
  class ApiError extends Error {
    constructor(mensaje, estado) {
      super(mensaje);
      this.name = "ApiError";
      this.estado = estado || 0;
    }
  }

  const copia = (x) => (x === undefined ? x : JSON.parse(JSON.stringify(x)));
  const esperar = () => new Promise((r) => setTimeout(r, CONFIG.LATENCIA_MS));
  const normalizar = (t) =>
    String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function hallar(lista, criterio, mensaje) {
    const item = lista.find(criterio);
    if (!item) throw new ApiError(mensaje, 404);
    return item;
  }

  /* ---------- Sesión (token) ---------- */
  const CLAVE_SESION = "sesion";

  function guardarSesion(sesion) {
    try { sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion)); } catch (e) { /* sin storage */ }
  }
  function leerSesion() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE_SESION)); } catch (e) { return null; }
  }
  function borrarSesion() {
    try { sessionStorage.removeItem(CLAVE_SESION); } catch (e) { /* sin storage */ }
  }
  function rutaLogin() {
    const p = window.location.pathname;
    return p.includes("/alumno/") || p.includes("/admin/") ? "../index.html" : "index.html";
  }

  /* ==========================================================
     IMPLEMENTACIÓN MOCK (usa mockData.js)
     ========================================================== */
  const mock = {
    /* ---------- Autenticación ---------- */
    async login({ rol, identificador, contrasena }) {
      await esperar();
      console.log("[MOCK] login:", { rol, identificador, contrasena });
      guardarSesion({ token: "mock-token", rol, identificador });
      return { rol, token: "mock-token" };
    },

    async registrarAlumno(datos) {
      await esperar();
      console.log("[MOCK] registrarAlumno:", datos);
      if (mockAlumnos.some((a) => a.boleta === datos.boleta)) {
        throw new ApiError("Número de boleta inválido: ya existe una cuenta con esa boleta.", 409);
      }
      mockAlumnos.push({
        nombre: [datos.nombres, datos.apellidoPaterno, datos.apellidoMaterno].join(" "),
        boleta: datos.boleta,
        correo: datos.correo,
        estado: "Activa",
        motivoSancion: null,
      });
      guardarSesion({ token: "mock-token", rol: "alumno", identificador: datos.boleta });
      return { rol: "alumno", token: "mock-token" };
    },

    async cerrarSesion() {
      console.log("[MOCK] cerrarSesion");
      borrarSesion();
    },

    /* ---------- Alumno: perfil ---------- */
    async obtenerPerfil() {
      await esperar();
      return copia(mockUsuario);
    },

    async actualizarPerfil({ nombreCompleto, correo }) {
      await esperar();
      console.log("[MOCK] actualizarPerfil:", { boleta: mockUsuario.boleta, nombreCompleto, correo });
      mockUsuario.nombreCompleto = nombreCompleto;
      mockUsuario.correo = correo;
      return copia(mockUsuario);
    },

    /* ---------- Alumno: catálogo y pedidos ---------- */
    async listarMateriales() {
      await esperar();
      return copia(mockMateriales);
    },

    async listarHorarios() {
      await esperar();
      return copia(mockHorarios);
    },

    async crearPedido({ materiales, horarioId }) {
      await esperar();
      if (mockUsuario.estado !== "Activa") {
        throw new ApiError("Tu cuenta no está activa. No puedes solicitar materiales.", 403);
      }
      const horario = hallar(mockHorarios, (h) => h.id === horarioId, "Horario no válido.");
      const piezas = materiales.map((id) => hallar(mockMateriales, (m) => m.id === id, "Material no encontrado."));

      if (piezas.length === 0) throw new ApiError("El pedido no tiene materiales.", 400);
      if (piezas.length > 8) throw new ApiError("Máximo 8 piezas por pedido.", 400);
      if (piezas.some((p) => !p.disponible)) {
        throw new ApiError("Alguna pieza ya no está disponible. Actualiza el catálogo.", 409);
      }

      // Reserva (transacción completa)
      piezas.forEach((p) => (p.disponible = false));

      const pedido = {
        boleta: mockUsuario.boleta,
        materiales,
        horarioEntrega: horario.etiqueta,
        fechaSolicitud: new Date().toISOString(),
      };
      console.log("[MOCK] crearPedido:", pedido);
      return { idPedido: "PR-" + String(Date.now()).slice(-4) };
    },

    async obtenerPrestamoActual() {
      await esperar();
      return mockPrestamos.actual ? copia(mockPrestamos.actual) : null;
    },

    async obtenerHistorial() {
      await esperar();
      return copia(mockPrestamos.historial);
    },

    /* ---------- Admin ---------- */
    async obtenerAdminActual() {
      await esperar();
      return copia(mockAdmin);
    },

    async listarInventario() {
      await esperar();
      return copia(mockInventario);
    },

    async registrarMaterial({ nombre, numeroSerie, descripcion, precioReposicion, foto }) {
      await esperar();
      if (mockInventario.some((m) => normalizar(m.numeroSerie) === normalizar(numeroSerie))) {
        throw new ApiError("Ya existe un material con ese número de serie.", 409);
      }
      const nuevo = {
        id: Math.max(0, ...mockInventario.map((m) => m.id)) + 1,
        nombre,
        numeroSerie,
        descripcion,
        precioReposicion,
        fotografia: foto ? foto.name : null,
        disponible: true,
      };
      console.log("[MOCK] registrarMaterial:", nuevo);
      mockInventario.push(nuevo);
      return copia(nuevo);
    },

    async listarSolicitudes() {
      await esperar();
      return copia(mockSolicitudes);
    },

    async aceptarPedido(idPedido) {
      await esperar();
      const s = hallar(mockSolicitudes, (x) => x.idPedido === idPedido, "Pedido no encontrado.");
      if (s.estado !== "Pendiente") throw new ApiError("El pedido ya fue resuelto.", 409);
      s.estado = "Aceptado";
      s.folioAdminAcepta = mockAdmin.folio;
      s.fechaAceptacion = new Date().toISOString();
      console.log("[MOCK] aceptarPedido:", {
        numero_pedido: s.idPedido,
        folio_admin_acepta: s.folioAdminAcepta,
        fecha_hora_aceptacion: s.fechaAceptacion,
      });
      return copia(s);
    },

    async rechazarPedido(idPedido) {
      await esperar();
      const s = hallar(mockSolicitudes, (x) => x.idPedido === idPedido, "Pedido no encontrado.");
      if (s.estado !== "Pendiente") throw new ApiError("El pedido ya fue resuelto.", 409);
      s.estado = "Rechazado";
      console.log("[MOCK] rechazarPedido:", { numero_pedido: s.idPedido });
      console.log("[MOCK] Evento PedidoRechazado:", {
        id_pedido: s.idPedido,
        lista_id_materiales: s.materiales.map((m) => m.numeroSerie),
      });
      s.materiales.forEach((m) => {
        const pieza = mockInventario.find((i) => i.numeroSerie === m.numeroSerie);
        if (pieza) pieza.disponible = true;
      });
      return copia(s);
    },

    async listarAlumnos() {
      await esperar();
      return copia(mockAlumnos);
    },

    async bloquearAlumno(boleta, motivo) {
      await esperar();
      if (!motivo || !motivo.trim()) throw new ApiError("El motivo es obligatorio para aplicar un bloqueo.", 400);
      const a = hallar(mockAlumnos, (x) => x.boleta === boleta, "Alumno no encontrado.");
      a.estado = "Bloqueada";
      a.motivoSancion = motivo.trim();
      console.log("[MOCK] bloquearAlumno:", { boleta, motivo_sancion: a.motivoSancion, folio_admin: mockAdmin.folio });
      return copia(a);
    },

    async quitarSanciones(boleta) {
      await esperar();
      const a = hallar(mockAlumnos, (x) => x.boleta === boleta, "Alumno no encontrado.");
      a.estado = "Activa";
      a.motivoSancion = null;
      console.log("[MOCK] quitarSanciones:", { boleta, folio_admin: mockAdmin.folio });
      return copia(a);
    },

    async listarDevoluciones() {
      await esperar();
      return copia(mockDevoluciones);
    },

    async marcarDevolucion(idDetalle) {
      await esperar();
      const d = hallar(mockDevoluciones, (x) => x.idDetalle === idDetalle, "Pieza no encontrada.");
      if (d.estado === "Devuelto") throw new ApiError("La pieza ya fue devuelta.", 409);

      d.estado = "Devuelto";
      d.fechaDevolucion = new Date().toISOString();
      d.folioAdminRecibe = mockAdmin.folio;
      console.log("[MOCK] marcarComponenteDevuelto:", {
        id_detalle: d.idDetalle,
        folio_admin_recibe: d.folioAdminRecibe,
        fecha_hora_devolucion: d.fechaDevolucion,
      });
      console.log("[MOCK] Evento ComponenteDevuelto:", { identificador_material: d.idMaterial });

      const pieza = mockInventario.find((i) => i.id === d.idMaterial);
      if (pieza) pieza.disponible = true;

      const faltan = mockDevoluciones.filter((x) => x.idPedido === d.idPedido && x.estado !== "Devuelto");
      const pedidoCompletado = faltan.length === 0;
      if (pedidoCompletado) console.log("[MOCK] Evento PedidoCompletado:", { boleta_alumno: d.boleta });

      return { idPedido: d.idPedido, pedidoCompletado };
    },
  };

  /* ==========================================================
     IMPLEMENTACIÓN REAL (fetch al backend)
     >>> AJUSTAR rutas y nombres de campos con el equipo backend <<<
     ========================================================== */
  async function request(metodo, ruta, cuerpo) {
    const headers = {};
    const sesion = leerSesion();
    if (sesion && sesion.token) headers.Authorization = "Bearer " + sesion.token;

    let body;
    if (cuerpo instanceof FormData) {
      body = cuerpo; // el navegador pone el Content-Type con el boundary
    } else if (cuerpo !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(cuerpo);
    }

    let resp;
    try {
      resp = await fetch(CONFIG.API_BASE_URL + ruta, { method: metodo, headers, body });
    } catch (e) {
      throw new ApiError("No se pudo conectar con el servidor.", 0);
    }

    // Sesión inválida o expirada: de vuelta al login
    if (resp.status === 401 && ruta !== "/auth/login") {
      borrarSesion();
      window.location.href = rutaLogin();
      throw new ApiError("Tu sesión expiró. Inicia sesión de nuevo.", 401);
    }

    let datos = null;
    try { datos = resp.status === 204 ? null : await resp.json(); } catch (e) { /* sin cuerpo JSON */ }

    if (!resp.ok) {
      const mensaje = (datos && (datos.mensaje || datos.detail || datos.error)) || "Error del servidor (" + resp.status + ").";
      throw new ApiError(mensaje, resp.status);
    }
    return datos;
  }

  const real = {
    /* ---------- Autenticación ---------- */
    async login({ rol, identificador, contrasena }) {
      const datos = await request("POST", "/auth/login", { rol, identificador, contrasena });
      guardarSesion({ token: datos.token, rol: datos.rol || rol, identificador });
      return { rol: datos.rol || rol, token: datos.token };
    },

    async registrarAlumno(datos) {
      await request("POST", "/alumnos", datos);
      // Tras registrarse inicia sesión automáticamente
      return real.login({ rol: "alumno", identificador: datos.boleta, contrasena: datos.contrasena });
    },

    async cerrarSesion() {
      try { await request("POST", "/auth/logout"); } catch (e) { /* se descarta igual en cliente */ }
      borrarSesion();
    },

    /* ---------- Alumno ---------- */
    obtenerPerfil: () => request("GET", "/alumnos/me"),
    actualizarPerfil: (datos) => request("PUT", "/alumnos/me", datos),
    listarMateriales: () => request("GET", "/materiales"),
    listarHorarios: () => request("GET", "/horarios"),
    crearPedido: (datos) => request("POST", "/pedidos", datos),
    obtenerPrestamoActual: () => request("GET", "/pedidos/actual"),
    obtenerHistorial: () => request("GET", "/pedidos/historial"),

    /* ---------- Admin ---------- */
    obtenerAdminActual: () => request("GET", "/admin/me"),
    listarInventario: () => request("GET", "/admin/materiales"),

    registrarMaterial({ nombre, numeroSerie, descripcion, precioReposicion, foto }) {
      const form = new FormData();
      form.append("nombre", nombre);
      form.append("numeroSerie", numeroSerie);
      form.append("descripcion", descripcion);
      form.append("precioReposicion", precioReposicion);
      if (foto) form.append("fotografia", foto);
      return request("POST", "/admin/materiales", form);
    },

    listarSolicitudes: () => request("GET", "/admin/pedidos"),
    aceptarPedido: (id) => request("POST", "/admin/pedidos/" + encodeURIComponent(id) + "/aceptar"),
    rechazarPedido: (id) => request("POST", "/admin/pedidos/" + encodeURIComponent(id) + "/rechazar"),

    listarAlumnos: () => request("GET", "/admin/alumnos"),
    bloquearAlumno: (boleta, motivo) =>
      request("POST", "/admin/alumnos/" + encodeURIComponent(boleta) + "/bloquear", { motivo }),
    quitarSanciones: (boleta) =>
      request("POST", "/admin/alumnos/" + encodeURIComponent(boleta) + "/quitar-sanciones"),

    listarDevoluciones: () => request("GET", "/admin/devoluciones"),
    marcarDevolucion: (idDetalle) => request("POST", "/admin/devoluciones/" + encodeURIComponent(idDetalle) + "/devolver"),
  };

  /* ==========================================================
     EXPORTACIÓN: el resto del frontend solo ve "ApiClient"
     ========================================================== */
  window.ApiClient = Object.freeze(Object.assign({ ApiError, CONFIG }, CONFIG.MODO_MOCK ? mock : real));
})();