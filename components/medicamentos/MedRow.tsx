'use client'
import { useState } from 'react'
import api from '@/lib/api'

export interface MedItem {
  medicamento_id: string
  residente_id: string
  residente: string
  habitacion?: string
  medicamento: string
  principio_activo?: string
  dosis: string
  unidad?: string
  frecuencia: string
  via?: string
  horarios?: string
  con_comida?: boolean
  observaciones?: string
  estado: 'pendiente' | 'administrado' | 'omitido'
  admin_nota?: string
  motivo_omision?: string
  administrado_por?: string
}

const ESTADO_CFG = {
  pendiente:    { label: 'Pendiente',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  administrado: { label: 'Administrado', cls: 'bg-green-100  text-green-700  border-green-200'  },
  omitido:      { label: 'Omitido',      cls: 'bg-red-100    text-red-700    border-red-200'    },
}

const VIA_LABEL: Record<string, string> = {
  oral: 'Oral', intravenosa: 'IV', intramuscular: 'IM',
  subcutanea: 'SC', topica: 'Tópica', inhalatoria: 'Inhal.', otra: 'Otra',
}

interface Props {
  med: MedItem
  onActualizado: (id: string, estado: 'administrado' | 'omitido', nota?: string) => void
  puedeAdministrar: boolean
}

export default function MedRow({ med, onActualizado, puedeAdministrar }: Props) {
  const [cargando, setCargando] = useState(false)
  const [mostrarOmision, setMostrarOmision] = useState(false)
  const [motivo, setMotivo] = useState('')

  const cfg = ESTADO_CFG[med.estado]

  async function marcarAdministrado() {
    setCargando(true)
    try {
      await api.put(`/medicamentos/${med.medicamento_id}/administrar`, {
        administrado: true,
        hora_programada: new Date().toTimeString().slice(0, 5),
      })
      onActualizado(med.medicamento_id, 'administrado')
    } finally {
      setCargando(false)
    }
  }

  async function marcarOmitido() {
    if (!motivo.trim()) return
    setCargando(true)
    try {
      await api.put(`/medicamentos/${med.medicamento_id}/administrar`, {
        administrado: false,
        motivo_omision: motivo,
        hora_programada: new Date().toTimeString().slice(0, 5),
      })
      onActualizado(med.medicamento_id, 'omitido', motivo)
      setMostrarOmision(false)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      med.estado === 'administrado' ? 'bg-green-50 border-green-100 opacity-75' :
      med.estado === 'omitido'      ? 'bg-red-50 border-red-100 opacity-75' :
      'bg-white border-gray-100 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        {/* Indicador de estado */}
        <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
          med.estado === 'administrado' ? 'bg-green-500' :
          med.estado === 'omitido'      ? 'bg-red-400' :
          'bg-yellow-400 animate-pulse'
        }`} />

        <div className="flex-1 min-w-0">
          {/* Nombre + estado */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm">{med.medicamento}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.cls}`}>
              {cfg.label}
            </span>
            {med.via && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {VIA_LABEL[med.via] ?? med.via}
              </span>
            )}
            {med.con_comida && (
              <span className="text-xs text-gray-400">🍽 Con comida</span>
            )}
          </div>

          {med.principio_activo && (
            <p className="text-xs text-gray-400 mb-1">{med.principio_activo}</p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{med.dosis} {med.unidad ?? ''}</span>
            <span>{med.frecuencia}</span>
            {med.horarios && <span>🕐 {med.horarios}</span>}
          </div>

          {/* Resultado */}
          {med.estado === 'administrado' && med.administrado_por && (
            <p className="text-xs text-green-600 mt-1">✓ Administrado por {med.administrado_por}</p>
          )}
          {med.estado === 'omitido' && med.motivo_omision && (
            <p className="text-xs text-red-500 mt-1">✗ Omitido: {med.motivo_omision}</p>
          )}
          {med.observaciones && (
            <p className="text-xs text-gray-400 mt-1 italic">{med.observaciones}</p>
          )}

          {/* Formulario de omisión */}
          {mostrarOmision && (
            <div className="mt-2 flex gap-2">
              <input
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                className="input-base text-xs flex-1"
                placeholder="Motivo de omisión..."
                autoFocus
              />
              <button
                onClick={marcarOmitido}
                disabled={cargando || !motivo.trim()}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
              >
                {cargando ? '...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setMostrarOmision(false)}
                className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-500"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Acciones */}
        {puedeAdministrar && med.estado === 'pendiente' && !mostrarOmision && (
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={marcarAdministrado}
              disabled={cargando}
              className="px-3 py-1.5 text-xs bg-mafe text-white rounded-lg hover:bg-mafe-hover transition-colors disabled:opacity-50 font-medium"
            >
              {cargando ? '...' : '✓ Dar'}
            </button>
            <button
              onClick={() => setMostrarOmision(true)}
              className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              ✗
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
