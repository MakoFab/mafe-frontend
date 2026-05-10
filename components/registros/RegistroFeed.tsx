import { RegistroDiario } from '@/types'
import { formatFechaHora } from '@/lib/utils'

const TURNO_COLOR: Record<string, string> = {
  mañana: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  tarde:  'bg-orange-100 text-orange-700 border-orange-200',
  noche:  'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const MOOD_EMOJI: Record<string, string> = {
  tranquilo: '😌', activo: '😊', agitado: '😤',
  triste: '😢', ansioso: '😰', confuso: '😵', dormido: '😴',
}

function PctBar({ pct, label }: { pct?: number; label: string }) {
  if (pct == null) return null
  const color = pct >= 75 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right font-medium text-gray-600">{pct}%</span>
    </div>
  )
}

interface Props {
  registros: (RegistroDiario & { residente_nombre?: string; cuidador_nombre?: string; habitacion?: string })[]
  mostrarResidente?: boolean
}

export default function RegistroFeed({ registros, mostrarResidente = false }: Props) {
  if (!registros.length) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-lg">📋</p>
        <p className="font-medium mt-2">Sin registros</p>
        <p className="text-sm mt-1">No hay registros para este filtro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {registros.map(reg => (
        <div key={reg.id} className="card hover:shadow-md transition-shadow">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize border ${TURNO_COLOR[reg.turno] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {reg.turno}
              </span>
              <span className="text-sm text-gray-500">{formatFechaHora(reg.fecha_hora)}</span>
              {mostrarResidente && (reg as any).residente_nombre && (
                <span className="text-sm font-medium text-gray-800">
                  · {(reg as any).residente_nombre}
                  {(reg as any).habitacion && (
                    <span className="font-normal text-gray-400"> Hab. {(reg as any).habitacion}</span>
                  )}
                </span>
              )}
            </div>
            {reg.estado_emocional && (
              <span className="text-2xl shrink-0" title={reg.estado_emocional}>
                {MOOD_EMOJI[reg.estado_emocional]}
              </span>
            )}
          </div>

          {/* Alimentación */}
          {(reg.desayuno_pct != null || reg.almuerzo_pct != null || reg.cena_pct != null) && (
            <div className="mb-3 p-2 bg-gray-50 rounded-lg space-y-1.5">
              <p className="text-xs font-medium text-gray-600">Alimentación</p>
              <PctBar pct={reg.desayuno_pct} label="Desayuno" />
              <PctBar pct={reg.almuerzo_pct} label="Almuerzo" />
              <PctBar pct={reg.cena_pct}     label="Cena" />
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {reg.bano_realizado  && <span className="badge-info">🚿 Baño</span>}
            {reg.higiene_oral    && <span className="badge-info">🦷 Higiene oral</span>}
            {reg.cambio_ropa     && <span className="badge-info">👕 Cambio ropa</span>}
            {reg.movilidad       && <span className="badge-purple capitalize">{reg.movilidad}</span>}
            {reg.hidratacion     && <span className="badge-cyan">💧 {reg.hidratacion}</span>}
            {reg.horas_sueno != null && (
              <span className="badge-indigo">
                😴 {reg.horas_sueno}h {reg.calidad_sueno ? `(${reg.calidad_sueno})` : ''}
              </span>
            )}
            {reg.miccion         && <span className="badge-gray capitalize">{reg.miccion}</span>}
            {reg.deposicion      && <span className="badge-gray">Deposición ✓</span>}
          </div>

          {reg.actividad_fisica && (
            <p className="text-xs text-gray-500 mb-2">🏃 {reg.actividad_fisica}</p>
          )}
          {reg.observaciones && (
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 mb-2">
              <span className="font-medium">Obs.: </span>{reg.observaciones}
            </p>
          )}
          {reg.novedades && (
            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-2">
              <span className="font-medium">⚠ Novedad: </span>{reg.novedades}
            </p>
          )}
          {(reg as any).cuidador_nombre && (
            <p className="text-xs text-gray-400 mt-2">Por: {(reg as any).cuidador_nombre}</p>
          )}
        </div>
      ))}
    </div>
  )
}
