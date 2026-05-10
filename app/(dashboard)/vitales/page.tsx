'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import api from '@/lib/api'

// ── tipos ────────────────────────────────────────────────────
interface ResumenVital {
  residente_id: string
  residente: string
  habitacion: string
  fecha_hora?: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  saturacion_o2?: number
  temperatura?: number
  glucosa?: number
  peso?: number
  alerta_generada?: boolean
  registrado_por?: string
}

// ── rangos normales ──────────────────────────────────────────
const RANGOS = {
  presion_sistolica:   { ok: [90,  139], at: [80,  159] },
  presion_diastolica:  { ok: [60,  89],  at: [50,  99]  },
  frecuencia_cardiaca: { ok: [60,  100], at: [50,  110] },
  saturacion_o2:       { ok: [95,  100], at: [92,  100] },
  temperatura:         { ok: [36.0,37.5],at: [35.5,38.0]},
  glucosa:             { ok: [70,  140], at: [60,  180] },
}

type RangoKey = keyof typeof RANGOS

function semaforo(campo: RangoKey, val?: number | null): 'verde' | 'amarillo' | 'rojo' | 'gris' {
  if (val == null) return 'gris'
  const { ok, at } = RANGOS[campo]
  if (val >= ok[0] && val <= ok[1]) return 'verde'
  if (val >= at[0] && val <= at[1]) return 'amarillo'
  return 'rojo'
}

const DOT: Record<string, string> = {
  verde:    'bg-emerald-500',
  amarillo: 'bg-amber-400',
  rojo:     'bg-red-500',
  gris:     'bg-gray-200',
}
const CELDA: Record<string, string> = {
  verde:    'text-emerald-700 bg-emerald-50',
  amarillo: 'text-amber-700  bg-amber-50',
  rojo:     'text-red-700    bg-red-50 font-semibold',
  gris:     'text-gray-400',
}

function Celda({ campo, val, suffix }: { campo: RangoKey; val?: number | null; suffix: string }) {
  const color = semaforo(campo, val)
  if (val == null) return <span className="text-gray-300 text-sm">—</span>
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm ${CELDA[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[color]}`} />
      {val}{suffix}
    </span>
  )
}

function formatFechaCorta(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

// ── modal registro rápido ─────────────────────────────────────
interface ModalProps {
  residente: ResumenVital
  onClose: () => void
  onSaved: () => void
}

function ModalRegistro({ residente, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState({
    presion_sistolica: '', presion_diastolica: '', frecuencia_cardiaca: '',
    saturacion_o2: '', temperatura: '', glucosa: '', peso: '', observaciones: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [alertas, setAlertas]     = useState<string[]>([])
  const [error, setError]         = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      const body: Record<string, any> = { residente_id: residente.residente_id }
      if (form.presion_sistolica)   body.presion_sistolica   = Number(form.presion_sistolica)
      if (form.presion_diastolica)  body.presion_diastolica  = Number(form.presion_diastolica)
      if (form.frecuencia_cardiaca) body.frecuencia_cardiaca = Number(form.frecuencia_cardiaca)
      if (form.saturacion_o2)       body.saturacion_o2       = Number(form.saturacion_o2)
      if (form.temperatura)         body.temperatura         = Number(form.temperatura)
      if (form.glucosa)             body.glucosa             = Number(form.glucosa)
      if (form.peso)                body.peso                = Number(form.peso)
      if (form.observaciones)       body.observaciones       = form.observaciones
      const { data } = await api.post('/vitales', body)
      if (data.alertas?.length) setAlertas(data.alertas)
      else { onSaved(); onClose() }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  if (alertas.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Valores fuera de rango</p>
              <p className="text-sm text-gray-500">{residente.residente}</p>
            </div>
          </div>
          <ul className="space-y-2 mb-6">
            {alertas.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 rounded-xl p-3">
                <span className="mt-0.5 text-red-500">●</span>{a}
              </li>
            ))}
          </ul>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancelar
            </button>
            <button onClick={() => { onSaved(); onClose() }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
              Registrar de todas formas
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">Registrar signos vitales</p>
            <p className="text-sm text-gray-500">Hab. {residente.habitacion} · {residente.residente}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Sistólica (mmHg)</label>
              <input type="number" className="input-base" placeholder="120"
                value={form.presion_sistolica} onChange={e => set('presion_sistolica', e.target.value)} />
            </div>
            <div>
              <label className="label-base">Diastólica (mmHg)</label>
              <input type="number" className="input-base" placeholder="80"
                value={form.presion_diastolica} onChange={e => set('presion_diastolica', e.target.value)} />
            </div>
            <div>
              <label className="label-base">FC (bpm)</label>
              <input type="number" className="input-base" placeholder="72"
                value={form.frecuencia_cardiaca} onChange={e => set('frecuencia_cardiaca', e.target.value)} />
            </div>
            <div>
              <label className="label-base">SpO₂ (%)</label>
              <input type="number" className="input-base" placeholder="98"
                value={form.saturacion_o2} onChange={e => set('saturacion_o2', e.target.value)} />
            </div>
            <div>
              <label className="label-base">Temperatura (°C)</label>
              <input type="number" step="0.1" className="input-base" placeholder="36.5"
                value={form.temperatura} onChange={e => set('temperatura', e.target.value)} />
            </div>
            <div>
              <label className="label-base">Glucosa (mg/dL)</label>
              <input type="number" className="input-base" placeholder="100"
                value={form.glucosa} onChange={e => set('glucosa', e.target.value)} />
            </div>
            <div>
              <label className="label-base">Peso (kg)</label>
              <input type="number" step="0.1" className="input-base" placeholder="65.0"
                value={form.peso} onChange={e => set('peso', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label-base">Observaciones</label>
            <textarea className="input-base resize-none" rows={2} placeholder="Notas adicionales..."
              value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>

          {/* Leyenda rangos */}
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-0.5">
            <p className="font-medium text-gray-600 mb-1">Rangos normales</p>
            <p>Presión: 90–139 / 60–89 mmHg &nbsp;·&nbsp; FC: 60–100 bpm &nbsp;·&nbsp; SpO₂: ≥95%</p>
            <p>Temp: 36.0–37.5 °C &nbsp;·&nbsp; Glucosa: 70–140 mg/dL</p>
          </div>

          <button type="submit" disabled={guardando}
            className="w-full py-3 bg-mafe text-white font-semibold rounded-xl hover:bg-mafe-hover transition-colors disabled:opacity-60">
            {guardando ? 'Guardando...' : 'Guardar registro'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── página principal ─────────────────────────────────────────
export default function VitalesPage() {
  const [data, setData]     = useState<ResumenVital[]>([])
  const [cargando, setCarg] = useState(true)
  const [modal, setModal]   = useState<ResumenVital | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'alertas'>('todos')

  function cargar() {
    setCarg(true)
    api.get<ResumenVital[]>('/vitales/resumen')
      .then(r => setData(r.data))
      .finally(() => setCarg(false))
  }

  useEffect(() => { cargar() }, [])

  const lista = filtro === 'alertas' ? data.filter(d => d.alerta_generada) : data
  const totalAlertas = data.filter(d => d.alerta_generada).length

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Signos Vitales</h1>
            <p className="text-sm text-gray-500">Último registro de cada residente activo</p>
          </div>
          <div className="flex gap-2">
            {/* Filtro */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['todos', 'alertas'] as const).map(f => (
                <button key={f} onClick={() => setFiltro(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                    filtro === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {f === 'alertas' ? `⚠ Alertas (${totalAlertas})` : 'Todos'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Normal</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Atención</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Alerta</span>
        </div>

        {/* Tabla */}
        <div className="card overflow-x-auto p-0">
          {cargando ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Hab.', 'Residente', 'TA (mmHg)', 'FC', 'SpO₂', 'Temp.', 'Glucosa', 'Última toma', 'Acciones'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lista.map(r => (
                  <tr key={r.residente_id} className={`hover:bg-gray-50 transition-colors ${r.alerta_generada ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-700">{r.habitacion}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.alerta_generada && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Alerta activa" />
                        )}
                        <Link href={`/residentes/${r.residente_id}/vitales`}
                          className="font-medium text-gray-900 hover:text-mafe transition-colors">
                          {r.residente}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.presion_sistolica != null ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-sm ${
                          CELDA[semaforo('presion_sistolica', r.presion_sistolica)]
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[semaforo('presion_sistolica', r.presion_sistolica)]}`} />
                          {r.presion_sistolica}/{r.presion_diastolica}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Celda campo="frecuencia_cardiaca" val={r.frecuencia_cardiaca} suffix=" bpm" />
                    </td>
                    <td className="px-4 py-3">
                      <Celda campo="saturacion_o2" val={r.saturacion_o2} suffix="%" />
                    </td>
                    <td className="px-4 py-3">
                      <Celda campo="temperatura" val={r.temperatura} suffix="°C" />
                    </td>
                    <td className="px-4 py-3">
                      <Celda campo="glucosa" val={r.glucosa} suffix=" mg/dL" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatFechaCorta(r.fecha_hora)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(r)}
                          className="text-xs font-medium text-mafe hover:text-mafe-hover px-2 py-1 rounded-lg hover:bg-mafe/10 transition-colors whitespace-nowrap"
                        >
                          + Registrar
                        </button>
                        <Link href={`/residentes/${r.residente_id}/vitales`}
                          className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                          Ver gráficas →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <ModalRegistro
          residente={modal}
          onClose={() => setModal(null)}
          onSaved={cargar}
        />
      )}
    </>
  )
}
