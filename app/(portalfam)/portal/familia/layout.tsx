'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { obtenerUsuario, cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/portal/familia',            icon: '🏠', label: 'Inicio' },
  { href: '/portal/familia/actividades', icon: '📋', label: 'Actividades' },
  { href: '/portal/familia/fotos',       icon: '📷', label: 'Fotos' },
  { href: '/portal/familia/mensajes',    icon: '💬', label: 'Mensajes' },
  { href: '/portal/familia/visitas',     icon: '📅', label: 'Visitas' },
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
      {/* Topbar */}
      <header className="bg-mafe-oscuro text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-mafe rounded-lg flex items-center justify-center font-black text-xs">M</div>
            <div>
              <p className="font-semibold text-sm leading-none">Portal Familiar · Mafe</p>
              {nombre && <p className="text-white/60 text-xs mt-0.5">Hola, {nombre}</p>}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 shadow-lg">
        <div className="max-w-lg mx-auto flex">
          {NAV.map(item => {
            const activo = item.href === '/portal/familia'
              ? pathname === '/portal/familia'
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors',
                  activo
                    ? 'text-mafe border-t-2 border-mafe -mt-px'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                <span className="text-lg leading-none">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
