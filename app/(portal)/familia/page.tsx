'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'
import { formatFecha, formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

const MOOD_EMOJI: Record<string, string> = {
  tranquilo: '😌', activo: '😊', agitado: '😤',
  triste: '😢', ansioso: '😰', confuso: '😵', dormido: '😴',
}

const TURNO_LABEL: Record<string, string> = {
  mañana: '🌅 Mañana', tarde: '🌤 Tarde', noche: '🌙 Noche',
}

interface Resumen {
  residente: {
    residente_nombre: string
    habitacion: string
    estado: string
    edad: number
    parentesco: string
  }
  registros_hoy: any[]
  medicamentos: any[]
  ultimo_vital: any
  proxima_visita: any
  fotos_recientes: any[]
}

export default function PortalInicioPage() {
  const [data, setData] = useState<Resumen | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<Resumen>('/familia/resumen')
      .then(r => setData(r.data))
      .catch(() => setError('No se pudo cargar la información. Intenta de nuevo.'))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <Spinner />
  if (error)    return <div className="card text-center py-10 text-red-500">{error}</div>
  if (!data)    return null

  const { residente, registros_hoy, medicamentos, ultimo_vital, proxima_visita, fotos_recientes } = data
  const ultimoRegistro = registros_hoy[0]

  return (
    <div className="space-y-4">
      {/* Tarjeta del residente */}
      <div className="bg-mafe-oscuro text-white rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-mafe flex items-center justify-center text-white font-bold text-xl shrink-0">
            {residente.residente_nombre.split(' ').map((p: string) => p[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm text-white/60">{residente.parentesco}</p>
            <h1 className="text-xl font-bold">{residente.residente_nombre}</h1>
            <p className="text-white/70 text-sm">
              {residente.edad} años · Hab. {residente.habitacion ?? '—'}
            </p>
          </div>
        </div>
        {residente.estado !== 'activo' && (
          <div className="mt-3 bg-white/10 rounded-lg px-3 py-2 text-sm capitalize">
            Estado: <span className="font-semibold">{residente.estado}</span>
          </div>
        )}
      </div>

      {/* Resumen del día */}
      {ultimoRegistro ? (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Hoy</h2>
            <span className="text-xs text-gray-400">{TURNO_LABEL[ultimoRegistro.turno]}</span>
          </div>

          {/* Estado emocional */}
          {ultimoRegistro.estado_emocional && (
            <div className="flex items-center gap-3 bg-mafe-claro rounded-xl p-3 mb-3">
              <span className="text-3xl">{MOOD_EMOJI[ultimoRegistro.estado_emocional]}</span>
              <div>
                <p className="text-xs text-gray-500">Estado emocional</p>
                <p className="font-semibold text-mafe-oscuro capitalize">{ultimoRegistro.estado_emocional}</p>
              </div>
            </div>
          )}

          {/* Alimentación */}
          {ultimoRegistro.almuerzo_pct != null && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 mb-2">Alimentación del día</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Desayuno', pct: ultimoRegistro.desayuno_pct },
                  { label: 'Almuerzo', pct: ultimoRegistro.almuerzo_pct },
                  { label: 'Cena',     pct: ultimoRegistro.cena_pct },
                ].filter(f => f.pct != null).map(f => (
                  <div key={f.label} className="flex items-center gap-2 text-xs">
                    <span className="w-16 text-gray-500">{f.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${f.pct! >= 75 ? 'bg-green-400' : f.pct! >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                        style={{ width: `${f.pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-medium">{f.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges de higiene */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ultimoRegistro.bano_realizado  && <span className="badge-info">🚿 Baño</span>}
            {ultimoRegistro.higiene_oral    && <span className="badge-info">🦷 Higiene oral</span>}
            {ultimoRegistro.cambio_ropa     && <span className="badge-info">👕 Cambio ropa</span>}
            {ultimoRegistro.actividad_fisica && (
              <span className="badge-purple">🏃 {ultimoRegistro.actividad_fisica}</span>
            )}
          </div>

          {ultimoRegistro.observaciones && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mt-1">
              <span className="font-medium">Nota del cuidador: </span>{ultimoRegistro.observaciones}
            </p>
          )}

          <Link href="/familia/actividades" className="block mt-3 text-xs text-mafe text-right hover:underline">
            Ver historial completo →
          </Link>
        </div>
      ) : (
        <div className="card text-center py-6 text-gray-400">
          <p>Aún no hay registros de hoy.</p>
        </div>
      )}

      {/* Signos vitales recientes */}
      {ultimo_vital && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Último control de salud</h2>
          <p className="text-xs text-gray-400 mb-3">{formatFechaHora(ultimo_vital.fecha_hora)}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ultimo_vital.presion_sistolica != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Presión</p>
                <p className="font-bold text-mafe-oscuro">{ultimo_vital.presion_sistolica}/{ultimo_vital.presion_diastolica}</p>
                <p className="text-xs text-gray-400">mmHg</p>
              </div>
            )}
            {ultimo_vital.frecuencia_cardiaca != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Pulso</p>
                <p className="font-bold text-mafe-oscuro">{ultimo_vital.frecuencia_cardiaca}</p>
                <p className="text-xs text-gray-400">bpm</p>
              </div>
            )}
            {ultimo_vital.temperatura != null && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Temperatura</p>
                <p className="font-bold text-mafe-oscuro">{ultimo_vital.temperatura}</p>
                <p className="text-xs text-gray-400">°C</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Medicamentos */}
      {medicamentos.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">
            Medicamentos activos <span className="text-gray-400 font-normal text-sm">({medicamentos.length})</span>
          </h2>
          <div className="space-y-2">
            {medicamentos.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="font-medium text-gray-800">{m.nombre}</span>
                <span className="text-gray-500 text-xs">{m.dosis} {m.unidad ?? ''} · {m.frecuencia}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próxima visita */}
      {proxima_visita ? (
        <div className="card border-l-4 border-l-mafe">
          <h2 className="font-semibold text-gray-800 mb-1">Próxima visita agendada</h2>
          <p className="text-mafe-oscuro font-bold">{formatFechaHora(proxima_visita.fecha_hora)}</p>
          {proxima_visita.notas && <p className="text-sm text-gray-500 mt-1">{proxima_visita.notas}</p>}
        </div>
      ) : (
        <div className="card flex items-center justify-between">
          <p className="text-sm text-gray-500">¿Quieres agendar una visita?</p>
          <Link href="/familia/visitas" className="btn-primary text-sm">Agendar</Link>
        </div>
      )}

      {/* Fotos recientes */}
      {fotos_recientes.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Fotos recientes</h2>
            <Link href="/familia/fotos" className="text-xs text-mafe hover:underline">Ver todas</Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {fotos_recientes.map((f: any, i: number) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={f.thumbnail_url ?? f.url_archivo}
                  alt={f.descripcion ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
