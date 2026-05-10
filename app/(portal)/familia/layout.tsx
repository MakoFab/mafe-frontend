'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { obtenerUsuario, cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Usuario } from '@/types'

const NAV = [
  { href: '/familia',            label: '🏠 Inicio' },
  { href: '/familia/actividades',label: '📋 Actividades' },
  { href: '/familia/fotos',      label: '📷 Fotos' },
  { href: '/familia/mensajes',   label: '💬 Mensajes' },
  { href: '/familia/visitas',    label: '📅 Visitas' },
]

export default function PortalFamiliaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    setUsuario(obtenerUsuario())
  }, [])

  function handleLogout() {
    cerrarSesion()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-mafe-claro">
      {/* Topbar */}
      <header className="bg-mafe-oscuro text-white shadow-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-mafe rounded-lg flex items-center justify-center font-bold text-xs">M</div>
            <span className="font-semibold text-sm">Portal Familiar · Mafe</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/70 text-sm hidden sm:block">{usuario?.nombre}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-white/60 hover:text-white transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {children}
      </main>

      {/* Navegación inferior (mobile-first) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto flex">
          {NAV.map(item => {
            const activo = item.href === '/familia'
              ? pathname === '/familia'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors',
                  activo
                    ? 'text-mafe border-t-2 border-mafe -mt-px'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                <span className="text-base leading-none mb-0.5">{item.label.split(' ')[0]}</span>
                <span className="hidden sm:block">{item.label.split(' ').slice(1).join(' ')}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
