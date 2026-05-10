'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

const MOOD: Record<string, string> = {
  tranquilo: '😌', activo: '😊', agitado: '😤',
  triste: '😢', ansioso: '😰', confuso: '😵', dormido: '😴',
}

const TURNO_COLOR: Record<string, string> = {
  mañana: 'bg-yellow-100 text-yellow-700',
  tarde:  'bg-orange-100 text-orange-700',
  noche:  'bg-indigo-100 text-indigo-700',
}

export default function ActividadesFamiliaPage() {
  const [registros, setRegistros] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [dias, setDias] = useState(7)

  useEffect(() => {
    setCargando(true)
    api.get(`/familia/actividades?dias=${dias}`)
      .then(r => setRegistros(r.data))
      .finally(() => setCargando(false))
  }, [dias])

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-mafe-oscuro">Actividades</h1>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dias === d ? 'bg-mafe text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {cargando ? <Spinner /> : registros.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Sin registros en este período.</div>
      ) : (
        <div className="space-y-3">
          {registros.map((reg: any, i: number) => (
            <div key={i} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TURNO_COLOR[reg.turno] ?? 'bg-gray-100 text-gray-500'}`}>
                    {reg.turno}
                  </span>
                  <span className="text-xs text-gray-400">{formatFechaHora(reg.fecha_hora)}</span>
                </div>
                {reg.estado_emocional && (
                  <span className="text-xl" title={reg.estado_emocional}>{MOOD[reg.estado_emocional]}</span>
                )}
              </div>

              {reg.almuerzo_pct != null && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: '🌅', nombre: 'Desayuno', pct: reg.desayuno_pct },
                    { label: '☀️', nombre: 'Almuerzo', pct: reg.almuerzo_pct },
                    { label: '🌙', nombre: 'Cena',     pct: reg.cena_pct },
                  ].map(f => f.pct != null ? (
                    <div key={f.nombre} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-500">{f.label} {f.nombre}</p>
                      <p className={`font-bold text-sm ${f.pct >= 75 ? 'text-green-600' : f.pct >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                        {f.pct}%
                      </p>
                    </div>
                  ) : null)}
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-1.5">
                {reg.bano_realizado     && <span className="badge-info">🚿 Baño</span>}
                {reg.higiene_oral       && <span className="badge-info">🦷 Higiene oral</span>}
                {reg.cambio_ropa        && <span className="badge-info">👕 Cambio ropa</span>}
                {reg.movilidad          && <span className="badge-purple capitalize">{reg.movilidad}</span>}
                {reg.actividad_fisica   && <span className="badge-purple">🏃 {reg.actividad_fisica}</span>}
                {reg.hidratacion        && <span className="badge-cyan">💧 {reg.hidratacion}</span>}
              </div>

              {reg.observaciones && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  {reg.observaciones}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1.5">Por: {reg.cuidador}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
