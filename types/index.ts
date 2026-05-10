export type Rol =
  | 'admin' | 'medico' | 'enfermera'
  | 'cuidador' | 'supervisor' | 'familiar' | 'proveedor'

export interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: Rol
  foto_url?: string
  telefono?: string
  ultimo_acceso?: string
}

export interface Residente {
  id: string
  nombre: string
  apellido: string
  nombre_completo?: string
  fecha_nacimiento: string
  genero?: string
  documento_tipo?: string
  documento_numero?: string
  foto_url?: string
  habitacion?: string
  fecha_ingreso: string
  fecha_egreso?: string
  estado: 'activo' | 'hospitalizado' | 'egresado' | 'fallecido'
  diagnosticos?: string
  alergias?: string
  tipo_sangre?: string
  eps?: string
  nivel_dependencia?: string
  dieta_especial?: string
  observaciones?: string
  medico_id?: string
  medico_tratante?: string
  edad?: number
  numero_afiliacion?: string
}

export interface RegistroDiario {
  id: string
  residente_id: string
  residente?: string
  cuidador_id: string
  fecha_hora: string
  turno: 'mañana' | 'tarde' | 'noche'
  desayuno_pct?: number
  almuerzo_pct?: number
  cena_pct?: number
  hidratacion?: string
  bano_realizado?: boolean
  higiene_oral?: boolean
  cambio_ropa?: boolean
  movilidad?: string
  estado_emocional?: string
  horas_sueno?: number
  calidad_sueno?: string
  observaciones?: string
  novedades?: string
  miccion?: string
  deposicion?: string
  actividad_fisica?: string
}

export interface SignosVitales {
  id: string
  residente_id: string
  fecha_hora: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  frecuencia_resp?: number
  saturacion_o2?: number
  temperatura?: number
  glucosa?: number
  peso?: number
  observaciones?: string
}

export interface Medicamento {
  medicamento_id: string
  residente: string
  habitacion?: string
  medicamento: string
  dosis: string
  horarios?: string
  via?: string
  estado: 'pendiente' | 'administrado' | 'omitido'
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}
