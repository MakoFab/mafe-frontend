import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFecha(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(d, 'dd/MM/yyyy', { locale: es })
}

export function formatFechaHora(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? parseISO(fecha) : fecha
  return format(d, "dd/MM/yyyy hh:mm a", { locale: es })
}

export function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date()
  const nac = parseISO(fechaNacimiento)
  let edad = hoy.getFullYear() - nac.getFullYear()
  const m = hoy.getMonth() - nac.getMonth()
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export function etiquetaRol(rol: string): string {
  const etiquetas: Record<string, string> = {
    admin: 'Administrador',
    medico: 'Médico',
    enfermera: 'Enfermera',
    cuidador: 'Cuidador',
    supervisor: 'Supervisor',
    familiar: 'Familiar',
    proveedor: 'Proveedor',
  }
  return etiquetas[rol] ?? rol
}
