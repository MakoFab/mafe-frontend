'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatFecha } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Medicamento {
  id: string
  nombre: string
  principio_activo?: string
  dosis: string
  unidad?: string
  frecuencia: string
  via?: string
  horarios?: string
  con_comida?: boolean
  fecha_inicio: string
  fecha_fin?: string
  activo: boolean
  observaciones?: string
  prescrito_por_nombre?: string
}

const VIA_COLOR: Record<string, string> = {
  oral:          'bg-green-100 text-green-700',
  intravenosa:   'bg-red-100 text-red-700',
  intramuscular: 'bg-orange-100 text-orange-700',
  topica:        'bg-blue-100 text-blue-700',
  inhalatoria:   'bg-purple-100 text-purple-700',
}

export default function MedicamentosResidentePage() {
  const { id } = useParams<{ id: string }>()
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([])
  const [cargando, setCargando] = useState(true)
  const [soloActivos, setSoloActivos] = useState(true)

  useEffect(() => {
    setCargando(true)
    api.get<Medicamento[]>(`/residentes/${id}/medicamentos?activo=${soloActivos}`)
      .then(r => setMedicamentos(r.data))
      .finally(() => setCargando(false))
  }, [id, soloActivos])

  const activos = medicamentos.filter(m => m.activo)
  const inactivos = medicamentos.filter(m => !m.activo)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">
          Medicamentos <span className="text-sm text-gray-400 font-normal">({activos.length} activos)</span>
        </h2>
        <button
          onClick={() => setSoloActivos(v => !v)}
          className="text-xs text-mafe hover:underline"
        >
          {soloActivos ? 'Ver todos' : 'Solo activos'}
        </button>
      </div>

      {cargando ? <Spinner /> : medicamentos.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">Sin medicamentos registrados.</div>
      ) : (
        <div className="space-y-3">
          {medicamentos.map(m => (
            <div key={m.id} className={`card ${!m.activo ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{m.nombre}</p>
                    {m.via && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${VIA_COLOR[m.via] ?? 'bg-gray-100 text-gray-600'}`}>
                        {m.via}
                      </span>
                    )}
                    {!m.activo && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </div>
                  {m.principio_activo && (
                    <p className="text-xs text-gray-400 mt-0.5">{m.principio_activo}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-mafe-oscuro">{m.dosis} {m.unidad ?? ''}</p>
                  <p className="text-xs text-gray-500">{m.frecuencia}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-500">
                {m.horarios && <span>🕐 {m.horarios}</span>}
                {m.con_comida && <span>🍽 Con comida</span>}
                <span>📅 Desde {formatFecha(m.fecha_inicio)}</span>
                {m.fecha_fin && <span>Hasta {formatFecha(m.fecha_fin)}</span>}
                {m.prescrito_por_nombre && <span className="col-span-2">Dr/a. {m.prescrito_por_nombre}</span>}
              </div>

              {m.observaciones && (
                <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2">{m.observaciones}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
