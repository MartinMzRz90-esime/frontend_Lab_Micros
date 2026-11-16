/* ==========================================================
   mockData.js - Datos falsos mientras no exista la API
   Se reemplazará por llamadas reales en apiClient.js
   ========================================================== */

/*
  Para probar el modal cambia "estado" por:
    "Activa" | "Suspendida" | "Bloqueada"
  Si es "Bloqueada", se muestra "motivoSancion" como causa.
*/
const mockUsuario = {
  nombreCompleto: "Daniela Hernández López",
  boleta: "2026630148",
  correo: "daniela.hl@alumno.ipn.mx",
  estado: "Suspendida",
  motivoSancion: "El osciloscopio DS1054Z-2023-000219 se devolvió con una sonda dañada.",
};

const mockMateriales = [
  {
    id: 1,
    nombre: "Multímetro digital",
    modelo: "Fluke 117",
    numeroSerie: "FL117-2024-008745",
    imagen: "../img/multimetro.jpg",
    disponible: true,
  },
  {
    id: 2,
    nombre: "Multímetro digital",
    modelo: "Fluke 117",
    numeroSerie: "FL117-2024-008746",
    imagen: "../img/multimetro.jpg",
    disponible: true,
  },
  {
    id: 3,
    nombre: "Multímetro digital",
    modelo: "Fluke 117",
    numeroSerie: "FL117-2024-008747",
    imagen: "../img/multimetro.jpg",
    disponible: false,
  },
  {
    id: 4,
    nombre: "Osciloscopio digital",
    modelo: "Rigol DS1054Z",
    numeroSerie: "DS1054Z-2023-000219",
    imagen: "../img/osciloscopio.jpg",
    disponible: true,
  },
  {
    id: 5,
    nombre: "Osciloscopio digital",
    modelo: "Rigol DS1054Z",
    numeroSerie: "DS1054Z-2023-000220",
    imagen: "../img/osciloscopio.jpg",
    disponible: true,
  },
  {
    id: 6,
    nombre: "Fuente de poder DC",
    modelo: "Rigol DP832",
    numeroSerie: "DP832-2022-004410",
    imagen: "../img/fuente.jpg",
    disponible: true,
  },
  {
    id: 7,
    nombre: "Generador de funciones",
    modelo: "Rigol DG1022Z",
    numeroSerie: "DG1022Z-2023-001873",
    imagen: "../img/generador.jpg",
    disponible: true,
  },
  {
    id: 8,
    nombre: "Tarjeta de desarrollo",
    modelo: "STM32 Nucleo-F103RB",
    numeroSerie: "NUC-F103-2025-000312",
    imagen: "../img/nucleo.jpg",
    disponible: true,
  },
];

const mockHorarios = [
  { id: "h1", etiqueta: "10:00 a 11:00 h" },
  { id: "h2", etiqueta: "13:00 a 14:00 h" },
];

/* ==========================================================
   FASE 3 - Préstamos 
   - "actual": préstamo vigente del alumno.
     Para probar la vista vacía, cambiar a "actual" por null.
   - "historial": una fila por material solicitado.
     fechaDevolucion: null  => "Pendiente · En préstamo"
   ========================================================== */
const mockPrestamos = {
  actual: {
    idPedido: "PR-0251",
    estado: "En préstamo",
    fechaPedido: "2026-10-22T08:35:00",
    fechaEntrega: "2026-10-22T10:00:00",
    devolucionPrevista: "2026-10-23T14:00:00",
    materiales: [
      {
        nombre: "Multímetro digital",
        modelo: "Fluke 117",
        numeroSerie: "FL117-2024-008745",
        imagen: "../img/multimetro.jpg",
      },
    ],
  },

  historial: [
    {
      idPedido: "PR-0251",
      nombre: "Multímetro digital",
      modelo: "Fluke 117",
      numeroSerie: "FL117-2024-008745",
      fechaPedido: "2026-10-22T08:35:00",
      fechaDevolucion: null,
    },
    {
      idPedido: "PR-0238",
      nombre: "Multímetro digital",
      modelo: "Fluke 117",
      numeroSerie: "FL117-2024-008746",
      fechaPedido: "2026-10-15T09:10:00",
      fechaDevolucion: "2026-10-16T13:40:00",
    },
    {
      idPedido: "PR-0219",
      nombre: "Osciloscopio digital",
      modelo: "Rigol DS1054Z",
      numeroSerie: "DS1054Z-2023-000219",
      fechaPedido: "2026-10-08T11:00:00",
      fechaDevolucion: "2026-10-08T15:20:00",
    },
  ],
};

/* ==========================================================
   FASE 4 - Datos del portal del administrador
   ========================================================== */

/* Administrador en sesión */
const mockAdmin = {
  nombreCompleto: "Ana López Ortega",
  folio: 20200001,
};

/* Inventario (tabla materiales). Campos según el modelado de datos. */
const mockInventario = [
  { id: 1, nombre: "Multímetro digital",     numeroSerie: "FL117-2024-008745",   descripcion: "Fluke 117",            precioReposicion: 6500,  disponible: false },
  { id: 2, nombre: "Multímetro digital",     numeroSerie: "FL117-2024-008746",   descripcion: "Fluke 117",            precioReposicion: 6500,  disponible: true },
  { id: 3, nombre: "Multímetro digital",     numeroSerie: "FL117-2024-008747",   descripcion: "Fluke 117",            precioReposicion: 6500,  disponible: true },
  { id: 4, nombre: "Osciloscopio digital",   numeroSerie: "DS1054Z-2023-000219", descripcion: "Rigol DS1054Z",        precioReposicion: 7800,  disponible: true },
  { id: 5, nombre: "Osciloscopio digital",   numeroSerie: "DS1054Z-2023-000220", descripcion: "Rigol DS1054Z",        precioReposicion: 7800,  disponible: false },
  { id: 6, nombre: "Fuente de poder DC",     numeroSerie: "DP832-2022-004410",   descripcion: "Rigol DP832",          precioReposicion: 12500, disponible: false },
  { id: 7, nombre: "Generador de funciones", numeroSerie: "DG1022Z-2023-001873", descripcion: "Rigol DG1022Z",        precioReposicion: 5900,  disponible: false },
  { id: 8, nombre: "Tarjeta de desarrollo",  numeroSerie: "NUC-F103-2025-000312", descripcion: "STM32 Nucleo-F103RB", precioReposicion: 450,   disponible: true },
];

/* Solicitudes de préstamo. estado: "Pendiente" | "Aceptado" | "Rechazado" */
const mockSolicitudes = [
  {
    idPedido: "PR-0247",
    alumno: "Miguel Ángel Torres Ruiz",
    boleta: "2026630215",
    materiales: [{ nombre: "Multímetro digital", numeroSerie: "FL117-2024-008746" }],
    fechaSolicitud: "2026-11-05T11:30:00",
    horarioEntrega: "13:00 a 14:00 h",
    estado: "Pendiente",
  },
  {
    idPedido: "PR-0248",
    alumno: "Daniela Hernández López",
    boleta: "2026630148",
    materiales: [
      { nombre: "Osciloscopio digital", numeroSerie: "DS1054Z-2023-000219" },
      { nombre: "Multímetro digital", numeroSerie: "FL117-2024-008747" },
    ],
    fechaSolicitud: "2026-11-05T12:05:00",
    horarioEntrega: "13:00 a 14:00 h",
    estado: "Pendiente",
  },
  {
    idPedido: "PR-0249",
    alumno: "Karla Sofía Méndez Pérez",
    boleta: "2026630377",
    materiales: [{ nombre: "Tarjeta de desarrollo", numeroSerie: "NUC-F103-2025-000312" }],
    fechaSolicitud: "2026-11-05T12:40:00",
    horarioEntrega: "13:00 a 14:00 h",
    estado: "Pendiente",
  },
  {
    idPedido: "PR-0250",
    alumno: "Jorge Alberto Castillo Vega",
    boleta: "2026630411",
    materiales: [{ nombre: "Osciloscopio digital", numeroSerie: "DS1054Z-2023-000219" }],
    fechaSolicitud: "2026-11-05T13:15:00",
    horarioEntrega: "15:00 a 16:00 h",
    estado: "Pendiente",
  },
];

/* Directorio de alumnos. estado: "Activa" | "Suspendida" | "Bloqueada" */
const mockAlumnos = [
  { nombre: "Daniela Hernández López",      boleta: "2026630148", correo: "daniela.hl@alumno.ipn.mx",       estado: "Activa",     motivoSancion: null },
  { nombre: "Miguel Ángel Torres Ruiz",     boleta: "2026630215", correo: "miguel.torres@alumno.ipn.mx",    estado: "Activa",     motivoSancion: null },
  { nombre: "Luis Fernando Ramírez Soto",   boleta: "2026630302", correo: "luis.ramirez@alumno.ipn.mx",     estado: "Suspendida", motivoSancion: null },
  { nombre: "Karla Sofía Méndez Pérez",     boleta: "2026630377", correo: "karla.mendez@alumno.ipn.mx",     estado: "Activa",     motivoSancion: null },
  { nombre: "Jorge Alberto Castillo Vega",  boleta: "2026630411", correo: "jorge.castillo@alumno.ipn.mx",   estado: "Bloqueada",  motivoSancion: "El osciloscopio DS1054Z-2023-000219 se devolvió con una sonda dañada." },
];

/* Piezas prestadas (detalle_pedido). estado: "En préstamo" | "Vencido" | "Devuelto" */
const mockDevoluciones = [
  {
    idDetalle: 1, idPedido: "PR-0251", idMaterial: 1,
    material: "Multímetro digital", numeroSerie: "FL117-2024-008745",
    alumno: "Daniela Hernández López", boleta: "2026630148",
    fechaEntrega: "2026-10-22T10:00:00", devolucionPrevista: "2026-10-23T14:00:00",
    estado: "En préstamo", fechaDevolucion: null,
  },
  {
    idDetalle: 2, idPedido: "PR-0244", idMaterial: 5,
    material: "Osciloscopio digital", numeroSerie: "DS1054Z-2023-000220",
    alumno: "Miguel Ángel Torres Ruiz", boleta: "2026630215",
    fechaEntrega: "2026-11-04T10:00:00", devolucionPrevista: "2026-11-05T14:00:00",
    estado: "En préstamo", fechaDevolucion: null,
  },
  {
    idDetalle: 3, idPedido: "PR-0244", idMaterial: 6,
    material: "Fuente de poder DC", numeroSerie: "DP832-2022-004410",
    alumno: "Miguel Ángel Torres Ruiz", boleta: "2026630215",
    fechaEntrega: "2026-11-04T10:00:00", devolucionPrevista: "2026-11-05T14:00:00",
    estado: "En préstamo", fechaDevolucion: null,
  },
  {
    idDetalle: 4, idPedido: "PR-0239", idMaterial: 7,
    material: "Generador de funciones", numeroSerie: "DG1022Z-2023-001873",
    alumno: "Luis Fernando Ramírez Soto", boleta: "2026630302",
    fechaEntrega: "2026-10-28T13:00:00", devolucionPrevista: "2026-10-29T14:00:00",
    estado: "Vencido", fechaDevolucion: null,
  },
];