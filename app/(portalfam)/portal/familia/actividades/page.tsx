'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Registro {
  turno: string
  fecha_hora: string
  estado_emocional?: string
  desayuno_pct?: number
  almuerzo_pct?: number
  cena_pct?: number
  hidratacion?: number
  bano_realizado?: boolean
  higiene_oral?: boolean
  cambio_ropa?: boolean
  movilidad?: string
  actividad_fisica?: string
  observaciones?: string
  novedades?: string
  cuidador: string
}

const DIAS_OPTS = [
  { label: '7 días',  value: 7  },
  { label: '14 días', value: 14 },
  { label: '30 días', value: 30 },
]

const TURNO_CFG: Record<string, { label: string; bg: string; text: string }> = {
  mañana:  { label: 'Mañana',  bg: 'bg-amber-100',   text: 'text-amber-800'  },
  tarde:   { label: 'Tarde',   bg: 'bg-orange-100',  text: 'text-orange-800' },
  noche:   { label: 'Noche',   bg: 'bg-indigo-100',  text: 'text-indigo-800' },
}

const MOOD_CFG: Record<string, { emoji: string; label: string }> = {
  tranquilo: { emoji: '😌', label: 'Tranquilo' },
  activo:    { emoji: '😄', label: 'Activo'    },
  agitado:   { emoji: '😠', label: 'Agitado'   },
  triste:    { emoji: '😢', label: 'Triste'    },
  ansioso:   { emoji: '😟', label: 'Ansioso'   },
  confuso:   { emoji: '😵', label: 'Confuso'   },
  dormido:   { emoji: '😴', label: 'Dormido'   },
}

function PctBar({ label, pct }: { label: string; pct?: number }) {
  const v = pct ?? 0
  const color = v >= 75 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{v}%</span>
    </div>
  )
}

function Tag({ on, label }: { on?: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      on ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
    }`}>
      {on ? '✓' : '✗'} {label}
    </span>
  )
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(registros: Registro[]) {
  const groups: Record<string, Registro[]> = {}
  for (const r of registros) {
    const day = r.fecha_hora.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(r)
  }
  return groups
}

export default function ActividadesPage() {
  const [registros, setRegistros]   = useState<Registro[]>([])
  const [cargando, setCargando]     = useState(true)
  const [dias, setDias]             = useState(7)
  const [expandido, setExpandido]   = useState<string | null>(null)

  useEffect(() => {
    setCargando(true)
    api.get<Registro[]>(`/familia/actividades?dias=${dias}`)
      .then(r => setRegistros(r.data))
      .catch(() => setRegistros([]))
      .finally(() => setCargando(false))
  }, [dias])

  const grupos = groupByDay(registros)
  const dias_keys = Object.keys(grupos).sort().reverse()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Actividades</h1>
          <p className="text-sm text-gray-500">Registros del cuidador</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {DIAS_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => setDias(o.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dias === o.value
                  ? 'bg-white text-mafe shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {cargando && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!cargando && registros.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No hay registros en este período</p>
        </div>
      )}

      {!cargando && dias_keys.map(dia => (
        <div key={dia} className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 capitalize">
            {formatFecha(dia + 'T12:00:00')}
          </p>

          {grupos[dia].map((r, i) => {
            const key = `${dia}-${i}`
            const abierto = expandido === key
            const turno = TURNO_CFG[r.turno] ?? { label: r.turno, bg: 'bg-gray-100', text: 'text-gray-700' }
            const mood = r.estado_emocional ? MOOD_CFG[r.estado_emocional] : null

            return (
              <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  className="w-full text-left px-4 py-3"
                  onClick={() => setExpandido(abierto ? null : key)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${turno.bg} ${turno.text}`}>
                        {turno.label}
                      </span>
                      {mood && (
                        <span className="text-base leading-none" title={mood.label}>{mood.emoji}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatHora(r.fecha_hora)}</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cuidador: <span className="font-medium text-gray-700">{r.cuidador}</span>
                  </p>
                </button>

                {abierto && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-3">
                    {/* Alimentación */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Alimentación</p>
                      <div className="space-y-1.5">
                        <PctBar label="Desayuno" pct={r.desayuno_pct} />
                        <PctBar label="Almuerzo" pct={r.almuerzo_pct} />
                        <PctBar label="Cena"     pct={r.cena_pct}     />
                      </div>
                      {r.hidratacion != null && (
                        <p className="text-xs text-gray-500 mt-2">
                          Hidratación: <span className="font-medium text-gray-700">{r.hidratacion} ml</span>
                        </p>
                      )}
                    </div>

                    {/* Higiene y bienestar */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">Higiene y bienestar</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Tag on={r.bano_realizado}  label="Baño"        />
                        <Tag on={r.higiene_oral}    label="Higiene oral" />
                        <Tag on={r.cambio_ropa}     label="Cambio ropa" />
                      </div>
                    </div>

                    {/* Movilidad */}
                    {(r.movilidad || r.actividad_fisica) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">Movilidad</p>
                        <div className="flex flex-wrap gap-2">
                          {r.movilidad && (
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {r.movilidad}
                            </span>
                          )}
                          {r.actividad_fisica && (
                            <span className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {r.actividad_fisica}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Observaciones */}
                    {r.observaciones && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Observaciones</p>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                          {r.observaciones}
                        </p>
                      </div>
                    )}

                    {/* Novedades */}
                    {r.novedades && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">⚠ Novedades</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{r.novedades}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
