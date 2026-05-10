'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { RegistroDiario } from '@/types'
import RegistroFeed from '@/components/registros/RegistroFeed'
import Spinner from '@/components/ui/Spinner'

type RegistroExtendido = RegistroDiario & {
  residente_nombre: string
  cuidador_nombre: string
  habitacion: string
}

const TURNOS = ['mañana', 'tarde', 'noche']

function turnoActual(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 14)  return 'mañana'
  if (h >= 14 && h < 22) return 'tarde'
  return 'noche'
}

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<RegistroExtendido[]>([])
  const [cargando, setCargando] = useState(true)
  const [turno, setTurno] = useState(turnoActual())
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))

  const cargar = useCallback(() => {
    setCargando(true)
    const params = new URLSearchParams({ turno, fecha })
    api.get<RegistroExtendido[]>(`/registros?${params}`)
      .then(r => setRegistros(r.data))
      .finally(() => setCargando(false))
  }, [turno, fecha])

  useEffect(() => { cargar() }, [cargar])

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Registros diarios</h1>
          <p className="text-sm text-gray-500">{registros.length} registro{registros.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/registros/nuevo" className="btn-primary text-sm self-start sm:self-auto">
          + Nuevo registro
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="input-base sm:w-44"
        />
        <div className="flex gap-1">
          {TURNOS.map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                turno === t
                  ? 'bg-mafe text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={cargar}
          className="btn-secondary text-sm ml-auto"
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Resumen rápido del turno */}
      {!cargando && registros.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {
              label: 'Completados',
              valor: registros.length,
              color: 'border-l-green-400 text-green-600',
            },
            {
              label: 'Con novedades',
              valor: registros.filter(r => r.novedades).length,
              color: 'border-l-orange-400 text-orange-600',
            },
            {
              label: 'Promedio alimentación',
              valor: (() => {
                const con = registros.filter(r => r.almuerzo_pct != null)
                if (!con.length) return '—'
                const avg = con.reduce((s, r) => s + (r.almuerzo_pct ?? 0), 0) / con.length
                return `${Math.round(avg)}%`
              })(),
              color: 'border-l-blue-400 text-blue-600',
            },
          ].map(stat => (
            <div key={stat.label} className={`card border-l-4 ${stat.color}`}>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color.split(' ')[1]}`}>{stat.valor}</p>
            </div>
          ))}
        </div>
      )}

      {cargando ? <Spinner /> : (
        <RegistroFeed registros={registros} mostrarResidente />
      )}
    </div>
  )
}
