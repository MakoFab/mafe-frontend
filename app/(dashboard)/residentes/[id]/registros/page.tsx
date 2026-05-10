'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { RegistroDiario } from '@/types'
import { formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

const TURNO_COLOR: Record<string, string> = {
  mañana: 'bg-yellow-100 text-yellow-700',
  tarde:  'bg-orange-100 text-orange-700',
  noche:  'bg-indigo-100 text-indigo-700',
}

const ESTADO_EMOCIONAL_EMOJI: Record<string, string> = {
  tranquilo: '😌', activo: '😊', agitado: '😤',
  triste: '😢', ansioso: '😰', confuso: '😵', dormido: '😴',
}

function PctBar({ pct, label }: { pct?: number; label: string }) {
  if (pct == null) return null
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div
          className="bg-mafe h-2 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-600">{pct}%</span>
    </div>
  )
}

export default function RegistrosResidentePage() {
  const { id } = useParams<{ id: string }>()
  const [registros, setRegistros] = useState<RegistroDiario[]>([])
  const [cargando, setCargando] = useState(true)
  const [turno, setTurno] = useState('')

  useEffect(() => {
    setCargando(true)
    const params = new URLSearchParams()
    if (turno) params.set('turno', turno)
    api.get<RegistroDiario[]>(`/residentes/${id}/registros?${params}`)
      .then(r => setRegistros(r.data))
      .finally(() => setCargando(false))
  }, [id, turno])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Registros diarios</h2>
        <div className="flex gap-1">
          {['', 'mañana', 'tarde', 'noche'].map(t => (
            <button
              key={t}
              onClick={() => setTurno(t)}
              className={`px-3 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                turno === t
                  ? 'bg-mafe text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {cargando ? <Spinner /> : registros.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Sin registros para este filtro.</div>
      ) : (
        <div className="space-y-3">
          {registros.map(reg => (
            <div key={reg.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TURNO_COLOR[reg.turno] ?? 'bg-gray-100 text-gray-600'}`}>
                    {reg.turno}
                  </span>
                  <span className="text-sm text-gray-500">{formatFechaHora(reg.fecha_hora)}</span>
                </div>
                {reg.estado_emocional && (
                  <span className="text-lg" title={reg.estado_emocional}>
                    {ESTADO_EMOCIONAL_EMOJI[reg.estado_emocional] ?? ''}
                  </span>
                )}
              </div>

              {/* Alimentación */}
              {(reg.desayuno_pct != null || reg.almuerzo_pct != null || reg.cena_pct != null) && (
                <div className="mb-3 space-y-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">Alimentación</p>
                  <PctBar pct={reg.desayuno_pct} label="Desayuno" />
                  <PctBar pct={reg.almuerzo_pct} label="Almuerzo" />
                  <PctBar pct={reg.cena_pct} label="Cena" />
                </div>
              )}

              {/* Badges de higiene / movilidad */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {reg.bano_realizado && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🚿 Baño</span>}
                {reg.higiene_oral && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">🦷 Higiene oral</span>}
                {reg.cambio_ropa && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">👕 Cambio ropa</span>}
                {reg.movilidad && <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full capitalize">{reg.movilidad}</span>}
                {reg.hidratacion && <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-0.5 rounded-full">💧 {reg.hidratacion}</span>}
                {reg.horas_sueno != null && (
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                    😴 {reg.horas_sueno}h sueño {reg.calidad_sueno ? `(${reg.calidad_sueno})` : ''}
                  </span>
                )}
              </div>

              {reg.observaciones && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  <span className="font-medium">Observaciones: </span>{reg.observaciones}
                </p>
              )}
              {reg.novedades && (
                <p className="text-sm text-orange-700 bg-orange-50 rounded-lg p-2 mt-2">
                  <span className="font-medium">⚠ Novedades: </span>{reg.novedades}
                </p>
              )}
              {(reg as any).cuidador_nombre && (
                <p className="text-xs text-gray-400 mt-2">Registrado por: {(reg as any).cuidador_nombre}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
