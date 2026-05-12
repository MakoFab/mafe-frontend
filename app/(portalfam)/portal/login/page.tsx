'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { guardarSesion } from '@/lib/auth'
import { AuthResponse } from '@/types'

export default function PortalLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      if (data.usuario.rol !== 'familiar') {
        setError('Esta cuenta no tiene acceso al portal familiar. Use el sistema de gestión.')
        return
      }
      guardarSesion(data.token, data.usuario)
      router.push('/portal/familia')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-mafe-oscuro via-[#0d6b52] to-mafe flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-3xl font-black text-white">M</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Portal Familiar</h1>
        <p className="text-white/70 text-sm mt-1">Casa Geriátrica Mafe</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-7">
        <h2 className="text-lg font-bold text-gray-800 mb-1">Bienvenido</h2>
        <p className="text-sm text-gray-500 mb-6">
          Ingresa para ver el estado de tu familiar
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input-base"
              placeholder="tu@correo.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input-base"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-mafe text-white font-semibold rounded-xl hover:bg-mafe-hover transition-colors disabled:opacity-60 mt-2"
          >
            {cargando ? 'Ingresando...' : 'Ingresar al portal'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          ¿Problemas para ingresar? Comuníquese con la administración de Mafe.
        </p>
      </div>

      <p className="text-white/40 text-xs mt-8">© 2025 Casa Geriátrica Mafe · Bogotá, Colombia</p>
      <Link href="/" className="text-white/50 hover:text-white/80 transition-colors text-xs mt-2 inline-flex items-center gap-1">
        ← Volver al sitio web
      </Link>
    </div>
  )
}
