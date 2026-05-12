'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { guardarSesion } from '@/lib/auth'
import { AuthResponse } from '@/types'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
      if (data.usuario.rol === 'familiar') {
        setError('Esta cuenta es del portal familiar. Ingresa en /portal/login')
        return
      }
      guardarSesion(data.token, data.usuario)
      router.push('/inicio')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-mafe-claro overflow-y-auto">

      {/* Back link — top, always visible */}
      <div className="px-5 pt-5 pb-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-mafe-oscuro/60 hover:text-mafe-oscuro text-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al sitio web
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-8 min-h-[calc(100vh-56px)]">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-mafe mb-3 shadow-md">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <h1 className="text-xl font-bold text-mafe-oscuro">Casa Geriátrica Mafe</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Form card */}
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="usuario@mafe.com.co"
                  required
                  autoComplete="email"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={cargando}
                className="btn-primary w-full py-3"
              >
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Mafe © 2025 · Bogotá, Colombia
          </p>
        </div>
      </div>
    </main>
  )
}
