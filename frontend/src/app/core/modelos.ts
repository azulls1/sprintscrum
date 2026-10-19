/** Tipos de la API (contrato en specs/001-portal-sprintscrum/contracts/api.md). */
export type RolScrum = 'product_owner' | 'scrum_master' | 'developer';
export type Prioridad = 'Alta' | 'Media' | 'Baja';
export type TipoTarea = 'analisis' | 'backend' | 'frontend' | 'pruebas' | 'validacion';

export interface Proyecto {
  id: string;
  empresa: string;
  cliente: string;
  producto: string;
  objetivo_producto: string;
  objetivo_sprint: string;
  descripcion: string[];
  portada: { universidad: string; programa: string; asignatura: string; actividad: string; equipo: string; integrantes: string[]; profesora: string; fecha: string };
  duracion_dias: number;
  nota_backlog: string;
  nota_sprint: string;
  conclusion: string;
  palabras?: number;
}

export interface Integrante {
  id: number;
  nombre: string;
  nombre_corto: string;
  rol: string;
  rol_scrum: RolScrum;
  responsabilidad: string;
  orden: number;
}

export interface Historia {
  id: string;
  orden: number;
  texto: string;
  prioridad: Prioridad;
  puntos: number;
  en_sprint: boolean;
  criterios: string[];
  horas?: number;
  n_tareas?: number;
}

export interface Tarea {
  id: number;
  historia_id: string;
  nombre: string;
  responsable_id: number;
  responsable: string;
  horas: number;
  dia_inicio: number;
  dia_fin: number;
  tipo: TipoTarea;
  depende_de: number[];
}

export interface Evento {
  id: number;
  nombre: string;
  dia: number;
  dia_nombre: string;
  hora: string;
  duracion_min: number;
  facilitador: string;
  descripcion: string;
}

export interface Carga {
  integrante_id: number;
  nombre: string;
  rol: string;
  horas: number;
  tareas: number;
  por_dia: number[];
}

export interface PuntoBurndown {
  dia: string;
  ideal: number;
  plan: number;
  p10?: number;
  p50?: number;
  p90?: number;
}

export interface Resumen {
  proyecto: Proyecto;
  kpis: { historias: number; puntos_backlog: number; historias_sprint: number; puntos_sprint: number; tareas: number; horas: number; integrantes: number; dias: number; eventos: number; simulaciones: number };
  integrantes: Integrante[];
}

export interface Equipo {
  integrantes: (Integrante & { carga: Carga; tareas: Tarea[] })[];
  eventos: Evento[];
  proyecto: Proyecto;
}

export interface Backlog {
  historias: Historia[];
  nota: string;
}

export interface Sprint {
  historias: Historia[];
  tareas: Tarea[];
  eventos: Evento[];
  carga: Carga[];
  burndown: PuntoBurndown[];
  dias: string[];
  nota: string;
  objetivo_sprint: string;
}

export interface Reflexion {
  integrante_id: number;
  titulo: string;
  texto: string;
  nombre: string;
  rol: string;
  rol_scrum: RolScrum;
  palabras: number;
}

export interface Conclusion {
  texto: string;
  palabras: number;
  equipo: string;
}

export interface Requisito {
  id: string;
  criterio: string;
  texto: string;
  cumplido: boolean;
  aviso: boolean;
  evidencia: string;
  ruta: string;
}

export interface ParametrosSimulacion {
  iteraciones: number;
  variabilidad: number;
  capacidad_horas_dia: number;
  semilla?: number | null;
}

export interface ResultadoSimulacion {
  parametros: ParametrosSimulacion;
  plazo_horas: number;
  total_estimado_horas: number;
  prob_a_tiempo: number;
  termino: { p10: number; p50: number; p90: number };
  termino_plan_dia: number;
  histograma: { etiqueta: string; n: number; proporcion: number }[];
  burndown: PuntoBurndown[];
  historias: { id: string; puntos: number; prob_terminada: number }[];
  puntos: { comprometidos: number; esperados: number; prob_todos: number };
  carga: { integrante_id: number; nombre: string; horas_estimadas: number; capacidad_sprint: number; ocupacion: number; termino_p50_dia: number; termino_p90_dia: number; prob_a_tiempo: number }[];
  persona_critica: string;
  duracion_ms: number;
}

export interface Simulacion {
  id: string;
  estado: 'pendiente' | 'completada' | 'error';
  parametros: ParametrosSimulacion;
  resultado: ResultadoSimulacion | null;
  error: string | null;
  duracion_ms: number | null;
  creado_en: string;
  completado_en: string | null;
}

export interface ArchivoEntregable {
  ruta: string;
  nombre: string;
  tipo: string;
  criterio: string;
  detalle: string;
  bytes: number;
  sha256: string;
}

export interface Paquete {
  id: string;
  estado: 'pendiente' | 'completada' | 'error';
  archivo: string | null;
  n_archivos: number | null;
  bytes: number | null;
  sha256: string | null;
  error: string | null;
  creado_en: string;
  completado_en: string | null;
}

export interface Entregables {
  archivos: ArchivoEntregable[];
  total_bytes: number;
  entrega: (ArchivoEntregable & { contenido: { nombre: string; bytes: number }[]; leeme: string }) | null;
  ultimo_paquete: Paquete | null;
  recientes: Paquete[];
}

/** Colores por persona (categórica validada con dataviz: contraste, croma y daltonismo), estables por id. */
export const COLOR_PERSONA: Record<number, string> = { 1: '#2A78A8', 2: '#D9822B', 3: '#2E9E7A', 4: '#9B6BC9' };
export const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
export const NOMBRE_TIPO: Record<TipoTarea, string> = {
  analisis: 'Análisis', backend: 'Backend', frontend: 'Frontend', pruebas: 'Pruebas', validacion: 'Validación',
};
export const NOMBRE_ROL: Record<RolScrum, string> = { product_owner: 'Product owner', scrum_master: 'Scrum master', developer: 'Developer' };
