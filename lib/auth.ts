import { Usuario } from '@/types'

export function guardarSesion(token: string, usuario: Usuario) {
  localStorage.setItem('mafe_token', token)
  localStorage.setItem('mafe_usuario', JSON.stringify(usuario))
}

export function obtenerUsuario(): Usuario | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('mafe_usuario')
  return raw ? JSON.parse(raw) : null
}

export function obtenerToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('mafe_token')
}

export function cerrarSesion() {
  localStorage.removeItem('mafe_token')
  localStorage.removeItem('mafe_usuario')
}

export function estaAutenticado(): boolean {
  return !!obtenerToken()
}
