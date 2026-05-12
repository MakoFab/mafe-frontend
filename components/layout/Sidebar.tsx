'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { obtenerUsuario, cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Usuario } from '@/types'

const NAV_ITEMS = [
  { href: '/inicio',       label: 'Inicio',         icon: '🏠', roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/residentes',   label: 'Residentes',     icon: '👥', roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/registros',    label: 'Registros',      icon: '📋', roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/medicamentos', label: 'Medicamentos',   icon: '💊', roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/vitales',      label: 'Signos Vitales', icon: '💓', roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/incidentes',   label: 'Incidentes',     icon: '⚠️', roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/reportes',     label: 'Reportes',       icon: '📊', roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/cuidadores',   label: 'Cuidadores',     icon: '👩‍⚕️', roles: ['admin','supervisor'] },
  { href: '/usuarios',     label: 'Usuarios',       icon: '⚙️',  roles: ['admin'] },
]

interface Props {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    const u = obtenerUsuario()
    if (!u) { router.replace('/login'); return }
    if (u.rol === 'familiar') { router.replace('/portal/familia'); return }
    setUsuario(u)
  }, [router])

  function handleLogout() {
    cerrarSesion()
    router.push('/login')
  }

  // Close drawer when route changes (mobile nav tap)
  useEffect(() => { onClose() }, [pathname])

  const itemsVisibles = NAV_ITEMS.filter(item =>
    usuario?.rol && item.roles.includes(usuario.rol)
  )

  return (
    <aside
      className={cn(
        // Base styles — always a column
        'flex flex-col w-72 md:w-56 bg-mafe-oscuro text-white shrink-0 h-full',
        // Mobile: fixed drawer with slide transition; Desktop: static in flow
        'fixed md:static inset-y-0 left-0 z-50',
        'transition-transform duration-300 ease-in-out md:transition-none',
        mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* ── Brand row ── */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-mafe rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
            M
          </div>
          <span className="font-semibold text-sm leading-tight">Casa Geriátrica<br/>Mafe</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {itemsVisibles.map(item => {
          const activo = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                activo
                  ? 'bg-mafe text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10',
              )}
            >
              <span className="text-base leading-none shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ── User info + logout ── */}
      <div className="px-2 pb-4 border-t border-white/10 pt-4 shrink-0">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-white/50">Sesión iniciada como</p>
          <p className="text-sm font-semibold truncate">
            {usuario?.nombre} {usuario?.apellido}
          </p>
          <p className="text-xs text-white/50 capitalize">{usuario?.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/70
                     hover:text-white hover:bg-white/10 rounded-xl transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
