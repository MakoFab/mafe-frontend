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
    /* overflow-y-auto so the page scrolls on very small screens */
    <div className="min-h-screen bg-gradient-to-br from-mafe-oscuro via-[#0d6b52] to-mafe overflow-y-auto">

      {/* ── Back link — always visible at the top ── */}
      <div className="px-5 pt-5 pb-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al sitio web
        </Link>
      </div>

      {/* ── Centred content ── */}
      <div className="flex flex-col items-center px-4 py-6">

        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-2xl font-black text-white">M</span>
          </div>
          <h1 className="text-xl font-bold text-white">Portal Familiar</h1>
          <p className="text-white/70 text-xs mt-1">Casa Geriátrica Mafe</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
          <h2 className="text-base font-bold text-gray-800 mb-0.5">Bienvenido</h2>
          <p className="text-xs text-gray-500 mb-5">
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
                suppressHydrationWarning
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
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full py-3 bg-mafe text-white font-semibold rounded-xl hover:bg-mafe-hover transition-colors disabled:opacity-60"
            >
              {cargando ? 'Ingresando...' : 'Ingresar al portal'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            ¿Problemas para ingresar? Comuníquese con la administración de Mafe.
          </p>
        </div>

        <p className="text-white/40 text-xs mt-6 mb-4">
          © 2025 Casa Geriátrica Mafe · Bogotá, Colombia
        </p>
      </div>
    </div>
  )
}
