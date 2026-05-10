'use client'
import MedRow, { MedItem } from './MedRow'

interface Props {
  items: MedItem[]
  onActualizado: (id: string, estado: 'administrado' | 'omitido', nota?: string) => void
  puedeAdministrar: boolean
}

function agruparPorResidente(items: MedItem[]) {
  const mapa = new Map<string, { residente: string; habitacion?: string; meds: MedItem[] }>()
  for (const item of items) {
    if (!mapa.has(item.residente_id)) {
      mapa.set(item.residente_id, {
        residente:  item.residente,
        habitacion: item.habitacion,
        meds: [],
      })
    }
    mapa.get(item.residente_id)!.meds.push(item)
  }
  return [...mapa.values()].sort((a, b) =>
    (a.habitacion ?? '').localeCompare(b.habitacion ?? '')
  )
}

export default function MARTable({ items, onActualizado, puedeAdministrar }: Props) {
  if (!items.length) {
    return (
      <div className="card text-center py-16 text-gray-400">
        <p className="text-3xl mb-2">💊</p>
        <p className="font-medium">Sin medicamentos pendientes</p>
        <p className="text-sm mt-1">Todos los medicamentos del día han sido gestionados.</p>
      </div>
    )
  }

  const grupos = agruparPorResidente(items)

  return (
    <div className="space-y-5">
      {grupos.map(grupo => {
        const pendientes    = grupo.meds.filter(m => m.estado === 'pendiente').length
        const administrados = grupo.meds.filter(m => m.estado === 'administrado').length
        const omitidos      = grupo.meds.filter(m => m.estado === 'omitido').length
        const iniciales     = grupo.residente.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()

        return (
          <div key={grupo.residente} className="card">
            {/* Cabecera del residente */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-mafe-claro flex items-center justify-center text-mafe-oscuro font-bold text-sm shrink-0">
                {iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{grupo.residente}</p>
                {grupo.habitacion && (
                  <p className="text-xs text-gray-500">Habitación {grupo.habitacion}</p>
                )}
              </div>
              {/* Mini resumen */}
              <div className="flex gap-2 text-xs shrink-0">
                {pendientes > 0 && (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                    {pendientes} pendiente{pendientes > 1 ? 's' : ''}
                  </span>
                )}
                {administrados > 0 && (
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    {administrados} ✓
                  </span>
                )}
                {omitidos > 0 && (
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    {omitidos} ✗
                  </span>
                )}
              </div>
            </div>

            {/* Lista de medicamentos */}
            <div className="space-y-2">
              {grupo.meds.map(med => (
                <MedRow
                  key={med.medicamento_id}
                  med={med}
                  onActualizado={onActualizado}
                  puedeAdministrar={puedeAdministrar}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
