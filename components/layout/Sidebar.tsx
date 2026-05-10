'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { obtenerUsuario, cerrarSesion } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Rol, Usuario } from '@/types'

const NAV_ITEMS = [
  { href: '/inicio',        label: 'Inicio',          roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/residentes',    label: 'Residentes',      roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/registros',     label: 'Registros',       roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/medicamentos',  label: 'Medicamentos',    roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/vitales',       label: 'Signos Vitales',  roles: ['admin','medico','enfermera','cuidador','supervisor'] },
  { href: '/incidentes',    label: 'Incidentes',      roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/reportes',      label: 'Reportes',        roles: ['admin','medico','enfermera','supervisor'] },
  { href: '/cuidadores',    label: 'Cuidadores',      roles: ['admin','supervisor'] },
  { href: '/usuarios',      label: 'Usuarios',        roles: ['admin'] },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
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

  const itemsVisibles = NAV_ITEMS.filter(item =>
    usuario?.rol && item.roles.includes(usuario.rol)
  )

  return (
    <aside className="hidden md:flex flex-col w-56 bg-mafe-oscuro text-white shrink-0">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-mafe rounded-lg flex items-center justify-center font-bold text-sm">
          M
        </div>
        <span className="font-semibold text-sm">Casa Geriátrica Mafe</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {itemsVisibles.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-mafe text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-2 pb-4 border-t border-white/10 pt-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-white/60">Sesión iniciada como</p>
          <p className="text-sm font-medium truncate">{usuario?.nombre} {usuario?.apellido}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
