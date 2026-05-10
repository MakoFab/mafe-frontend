import Link from 'next/link'
import { Residente } from '@/types'
import { calcularEdad } from '@/lib/utils'
import ResidenteEstado from './ResidenteEstado'

export default function ResidenteCard({ r }: { r: Residente }) {
  const edad = r.edad ?? calcularEdad(r.fecha_nacimiento)
  const iniciales = `${r.nombre[0]}${r.apellido[0]}`.toUpperCase()

  return (
    <Link href={`/residentes/${r.id}`} className="card hover:shadow-md transition-shadow block">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-mafe-claro flex items-center justify-center text-mafe-oscuro font-bold text-sm shrink-0">
          {iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 truncate">
              {r.nombre} {r.apellido}
            </p>
            <ResidenteEstado estado={r.estado} />
          </div>
          <div className="mt-1 text-xs text-gray-500 space-y-0.5">
            <p>Hab. {r.habitacion ?? '—'} · {edad} años</p>
            {r.nivel_dependencia && <p className="capitalize">{r.nivel_dependencia}</p>}
            {r.diagnosticos && (
              <p className="truncate text-gray-400">{r.diagnosticos}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
