'use client'
import { useEffect, useState } from 'react'
import { obtenerUsuario } from '@/lib/auth'
import { etiquetaRol } from '@/lib/utils'
import { Usuario } from '@/types'

export default function Topbar() {
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    setUsuario(obtenerUsuario())
  }, [])

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900 leading-tight">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          <p className="text-xs text-gray-500">{etiquetaRol(usuario?.rol ?? '')}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-mafe flex items-center justify-center text-white text-sm font-bold">
          {usuario?.nombre?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
