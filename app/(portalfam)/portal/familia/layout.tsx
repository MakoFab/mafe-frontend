'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { obtenerUsuario, cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/portal/familia',             icon: '🏠', label: 'Inicio'      },
  { href: '/portal/familia/actividades', icon: '📋', label: 'Actividades' },
  { href: '/portal/familia/fotos',       icon: '📷', label: 'Fotos'       },
  { href: '/portal/familia/mensajes',    icon: '💬', label: 'Mensajes'    },
  { href: '/portal/familia/visitas',     icon: '📅', label: 'Visitas'     },
]

export default function PortalFamiliaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [nombre, setNombre] = useState('')

  useEffect(() => {
    const u = obtenerUsuario()
    if (!u || u.rol !== 'familiar') {
      router.replace('/portal/login')
      return
    }
    setNombre(u.nombre)
  }, [router])

  function handleLogout() {
    cerrarSesion()
    router.push('/portal/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Topbar ── */}
      <header className="bg-mafe-oscuro text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-3">

          {/* Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-mafe rounded-lg flex items-center justify-center font-black text-xs shrink-0">
              M
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-none truncate">Portal Familiar · Mafe</p>
              {nombre && (
                <p className="text-white/60 text-xs mt-0.5 truncate">Hola, {nombre}</p>
              )}
            </div>
          </div>

          {/* Logout — clearly visible */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 shrink-0 bg-white/15 hover:bg-white/25 active:bg-white/30
                       text-white text-sm font-medium px-3 py-1.5 rounded-xl transition-colors"
          >
            {/* power-off icon */}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.25 6.75A9 9 0 1 1 6.75 17.25M12 3v9" />
            </svg>
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* ── Contenido — extra bottom padding for nav + safe-area ── */}
      <main className="max-w-lg mx-auto px-4 pt-5 pb-36">
        {children}
      </main>

      {/* ── Bottom nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-lg mx-auto flex h-16">
          {NAV.map(item => {
            const activo = item.href === '/portal/familia'
              ? pathname === '/portal/familia'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                  activo ? 'text-mafe' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {/* active top border */}
                {activo && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-mafe" />
                )}
                <span className={cn(
                  'text-xl leading-none transition-transform duration-150',
                  activo && 'scale-110',
                )}>
                  {item.icon}
                </span>
                <span className={cn(
                  'text-[10px] font-medium leading-none',
                  activo && 'font-semibold',
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
