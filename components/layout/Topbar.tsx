'use client'
import { useEffect, useState } from 'react'
import { obtenerUsuario } from '@/lib/auth'
import { etiquetaRol } from '@/lib/utils'
import { Usuario } from '@/types'

interface Props {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    setUsuario(obtenerUsuario())
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">

      {/* ── Hamburger — mobile only ── */}
      <button
        onClick={onMenuClick}
        className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl
                   text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Brand name — mobile only (desktop shows in sidebar) ── */}
      <span className="md:hidden text-sm font-semibold text-mafe-oscuro flex-1 truncate">
        Casa Geriátrica Mafe
      </span>

      {/* Desktop spacer */}
      <div className="hidden md:block flex-1" />

      {/* ── User info ── */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          <p className="text-xs text-gray-500">{etiquetaRol(usuario?.rol ?? '')}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-mafe flex items-center justify-center text-white text-sm font-bold shrink-0">
          {usuario?.nombre?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
