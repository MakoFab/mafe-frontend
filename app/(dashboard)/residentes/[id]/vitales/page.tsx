'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts'

// ── tipos ────────────────────────────────────────────────────
interface Vital {
  id: string
  fecha_hora: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  saturacion_o2?: number
  temperatura?: number
  glucosa?: number
  peso?: number
  alerta_generada?: boolean
  alerta_descripcion?: string
  registrado_por?: string
}

interface Residente {
  id: string
  nombre: string
  apellido: string
  habitacion: string
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

const BADGE: Record<string, string> = {
  verde:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  amarillo: 'bg-amber-100  text-amber-700  border border-amber-200',
  rojo:     'bg-red-100    text-red-700    border border-red-200',
  gris:     'bg-gray-100   text-gray-400   border border-gray-200',
}

function formatEje(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' })
}

function formatFull(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
         d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

// ── tooltip ──────────────────────────────────────────────────
const TooltipCustom = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── gráfica ──────────────────────────────────────────────────
interface GraficaProps {
  titulo: string
  datos: any[]
  campos: { key: string; label: string; color: string }[]
  yDomain?: [number, number]
  refMin?: number
  refMax?: number
  suffix?: string
}

function Grafica({ titulo, datos, campos, yDomain, refMin, refMax, suffix = '' }: GraficaProps) {
  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4">{titulo}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={datos} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
          <YAxis domain={yDomain} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false}
            tickFormatter={v => `${v}${suffix}`} />
          <Tooltip content={<TooltipCustom />} />
          {campos.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {refMin != null && <ReferenceLine y={refMin} stroke="#fbbf24" strokeDasharray="4 4" />}
          {refMax != null && <ReferenceLine y={refMax} stroke="#f87171" strokeDasharray="4 4" />}
          {campos.map(c => (
            <Line key={c.key} type="monotone" dataKey={c.key} name={c.label}
              stroke={c.color} strokeWidth={2} dot={{ r: 2.5, fill: c.color }}
              activeDot={{ r: 5 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── formulario ───────────────────────────────────────────────
function FormRegistro({ residenteId, onGuardado }: { residenteId: string; onGuardado: () => void }) {
  const [form, setForm] = useState({
    presion_sistolica: '', presion_diastolica: '', frecuencia_cardiaca: '',
    saturacion_o2: '', temperatura: '', glucosa: '', peso: '', talla: '',
    frecuencia_resp: '', observaciones: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [alertas, setAlertas]     = useState<string[]>([])
  const [exito, setExito]         = useState(false)
  const [error, setError]         = useState('')

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true); setError(''); setAlertas([]); setExito(false)
    try {
      const body: Record<string, any> = { residente_id: residenteId }
      ;(['presion_sistolica','presion_diastolica','frecuencia_cardiaca',
         'saturacion_o2','glucosa','talla','frecuencia_resp'] as const).forEach(k => {
        if (form[k]) body[k] = Number(form[k])
      })
      ;(['temperatura','peso'] as const).forEach(k => {
        if (form[k]) body[k] = parseFloat(form[k])
      })
      if (form.observaciones) body.observaciones = form.observaciones

      const { data } = await api.post('/vitales', body)
      if (data.alertas?.length) setAlertas(data.alertas)
      else setExito(true)
      onGuardado()
      setForm({ presion_sistolica:'',presion_diastolica:'',frecuencia_cardiaca:'',
        saturacion_o2:'',temperatura:'',glucosa:'',peso:'',talla:'',frecuencia_resp:'',observaciones:'' })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  return (
    <div className="card p-6 space-y-5">
      <h2 className="text-base font-bold text-gray-900">Registrar nueva toma</h2>

      {error   && <div className="bg-red-50     text-red-700     text-sm rounded-xl p-3">{error}</div>}
      {exito   && <div className="bg-emerald-50 text-emerald-700 text-sm rounded-xl p-3">✓ Registro guardado correctamente</div>}
      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="text-sm font-semibold text-amber-800">⚠️ Valores fuera de rango</p>
          {alertas.map((a, i) => <p key={i} className="text-sm text-amber-700">• {a}</p>)}
        </div>
      )}

      <form onSubmit={guardar} className="space-y-4">
        {/* Presión */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Presión arterial</p>
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
          </div>
        </div>

        {/* Corazón */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Corazón y oxigenación</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">FC (bpm)</label>
              <input type="number" className="input-base" placeholder="72"
                value={form.frecuencia_cardiaca} onChange={e => set('frecuencia_cardiaca', e.target.value)} />
            </div>
            <div>
              <label className="label-base">FR (rpm)</label>
              <input type="number" className="input-base" placeholder="16"
                value={form.frecuencia_resp} onChange={e => set('frecuencia_resp', e.target.value)} />
            </div>
            <div>
              <label className="label-base">SpO₂ (%)</label>
              <input type="number" className="input-base" placeholder="98"
                value={form.saturacion_o2} onChange={e => set('saturacion_o2', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Otros */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Otros parámetros</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label-base">Temp. (°C)</label>
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
            <div>
              <label className="label-base">Talla (cm)</label>
              <input type="number" className="input-base" placeholder="165"
                value={form.talla} onChange={e => set('talla', e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <label className="label-base">Observaciones</label>
          <textarea className="input-base resize-none" rows={2}
            placeholder="Notas clínicas, contexto de la toma..."
            value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
        </div>

        {/* Referencia rangos */}
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-0.5">
          <p className="font-medium text-gray-600 mb-1">Rangos normales de referencia</p>
          <p>Presión: 90–139 / 60–89 mmHg &nbsp;·&nbsp; FC: 60–100 bpm &nbsp;·&nbsp; SpO₂: ≥95%</p>
          <p>Temperatura: 36.0–37.5 °C &nbsp;·&nbsp; Glucosa: 70–140 mg/dL</p>
        </div>

        <button type="submit" disabled={guardando} className="btn-primary w-full">
          {guardando ? 'Guardando...' : 'Guardar toma'}
        </button>
      </form>
    </div>
  )
}

// ── página principal ─────────────────────────────────────────
export default function VitalesResidentePage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [vitales,   setVitales]   = useState<Vital[]>([])
  const [residente, setResidente] = useState<Residente | null>(null)
  const [cargando,  setCargando]  = useState(true)
  const [dias,      setDias]      = useState(30)

  function cargar() {
    setCargando(true)
    Promise.all([
      api.get<Vital[]>(`/vitales/residente/${id}?dias=${dias}`),
      api.get<Residente>(`/residentes/${id}`),
    ])
      .then(([v, r]) => { setVitales(v.data); setResidente(r.data) })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargar() }, [id, dias])

  const chartData = vitales.map(v => ({
    dia:       formatEje(v.fecha_hora),
    sistolica: v.presion_sistolica   ?? null,
    diastolica:v.presion_diastolica  ?? null,
    fc:        v.frecuencia_cardiaca ?? null,
    spo2:      v.saturacion_o2       ?? null,
    temp:      v.temperatura    ? Number(v.temperatura) : null,
    glucosa:   v.glucosa        ? Number(v.glucosa)     : null,
    peso:      v.peso           ? Number(v.peso)        : null,
  }))

  const ultimo  = vitales[vitales.length - 1]
  const alertas = vitales.filter(v => v.alerta_generada)
  const nombre  = residente ? `${residente.nombre} ${residente.apellido}` : '...'

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => router.push('/vitales')} className="hover:text-mafe transition-colors">
          Signos Vitales
        </button>
        <span>/</span>
        <button onClick={() => router.push(`/residentes/${id}`)} className="hover:text-mafe transition-colors">
          {nombre}
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Historial</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{nombre}</h1>
          <p className="text-sm text-gray-500">
            {residente && `Habitación ${residente.habitacion}`}
            {ultimo && ` · Última toma: ${formatFull(ultimo.fecha_hora)}`}
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([7, 14, 30] as const).map(d => (
            <button key={d} onClick={() => setDias(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dias === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* Banner alertas */}
      {alertas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {alertas.length} registro{alertas.length > 1 ? 's' : ''} con valores fuera de rango
          </p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {alertas.slice(-5).reverse().map(v => (
              <p key={v.id} className="text-xs text-red-600">
                <span className="font-medium">{formatEje(v.fecha_hora)}:</span> {v.alerta_descripcion}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas último valor */}
      {ultimo && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Presión', display: ultimo.presion_sistolica != null ? `${ultimo.presion_sistolica}/${ultimo.presion_diastolica}` : null, campo: 'presion_sistolica' as RangoKey, rawVal: ultimo.presion_sistolica, unit: 'mmHg' },
            { label: 'FC',      display: ultimo.frecuencia_cardiaca, campo: 'frecuencia_cardiaca' as RangoKey, rawVal: ultimo.frecuencia_cardiaca, unit: 'bpm'    },
            { label: 'SpO₂',  display: ultimo.saturacion_o2,        campo: 'saturacion_o2'       as RangoKey, rawVal: ultimo.saturacion_o2,       unit: '%'      },
            { label: 'Temp.',   display: ultimo.temperatura,          campo: 'temperatura'         as RangoKey, rawVal: ultimo.temperatura ? Number(ultimo.temperatura) : null, unit: '°C' },
            { label: 'Glucosa', display: ultimo.glucosa,              campo: 'glucosa'             as RangoKey, rawVal: ultimo.glucosa ? Number(ultimo.glucosa) : null, unit: 'mg/dL'},
            { label: 'Peso',    display: ultimo.peso,                 campo: null,                              rawVal: null, unit: 'kg' },
          ].map(({ label, display, campo, rawVal, unit }) => {
            const color = campo ? semaforo(campo, rawVal ?? undefined) : 'gris'
            return (
              <div key={label} className={`rounded-2xl p-3 text-center ${campo ? BADGE[color] : 'bg-gray-50 border border-gray-200 text-gray-600'}`}>
                <p className="text-xs font-medium opacity-70">{label}</p>
                <p className="text-xl font-black mt-0.5 leading-none">{display ?? '—'}</p>
                <p className="text-xs opacity-60 mt-0.5">{unit}</p>
              </div>
            )
          })}
        </div>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Gráficas 2×3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Grafica
              titulo="Presión Arterial (mmHg)"
              datos={chartData}
              campos={[
                { key: 'sistolica',  label: 'Sistólica',  color: '#0ea5e9' },
                { key: 'diastolica', label: 'Diastólica', color: '#8b5cf6' },
              ]}
              yDomain={[50, 200]}
              refMin={90} refMax={139}
            />
            <Grafica
              titulo="Frecuencia Cardíaca (bpm)"
              datos={chartData}
              campos={[{ key: 'fc', label: 'FC', color: '#ef4444' }]}
              yDomain={[40, 140]}
              refMin={60} refMax={100}
            />
            <Grafica
              titulo="Glucosa en sangre (mg/dL)"
              datos={chartData}
              campos={[{ key: 'glucosa', label: 'Glucosa', color: '#f59e0b' }]}
              yDomain={[40, 350]}
              refMin={70} refMax={140}
            />
            <Grafica
              titulo="Saturación de Oxígeno (%)"
              datos={chartData}
              campos={[{ key: 'spo2', label: 'SpO₂', color: '#10b981' }]}
              yDomain={[85, 101]}
              refMin={95}
              suffix="%"
            />
            <Grafica
              titulo="Temperatura (°C)"
              datos={chartData}
              campos={[{ key: 'temp', label: 'Temp.', color: '#f97316' }]}
              yDomain={[34, 40]}
              refMin={36.0} refMax={37.5}
              suffix="°C"
            />
            <Grafica
              titulo="Peso (kg)"
              datos={chartData}
              campos={[{ key: 'peso', label: 'Peso', color: '#6366f1' }]}
              suffix=" kg"
            />
          </div>

          {/* Historial tabla */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Historial de registros</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Fecha y hora','TA','FC','SpO₂','Temp.','Glucosa','Peso','Por',''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...vitales].reverse().slice(0, 20).map(v => {
                    const sColor = semaforo('presion_sistolica', v.presion_sistolica)
                    return (
                      <tr key={v.id} className={v.alerta_generada ? 'bg-red-50/30' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{formatFull(v.fecha_hora)}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {v.presion_sistolica != null
                            ? <span className={`text-xs font-medium ${sColor === 'rojo' ? 'text-red-600' : sColor === 'amarillo' ? 'text-amber-600' : 'text-gray-700'}`}>
                                {v.presion_sistolica}/{v.presion_diastolica}
                              </span>
                            : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{v.frecuencia_cardiaca ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{v.saturacion_o2 != null ? `${v.saturacion_o2}%` : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{v.temperatura != null ? `${v.temperatura}°C` : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{v.glucosa ?? '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-700">{v.peso != null ? `${v.peso} kg` : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{v.registrado_por ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          {v.alerta_generada && (
                            <span className="text-xs text-red-500" title={v.alerta_descripcion ?? ''}>⚠</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulario */}
          <FormRegistro residenteId={id} onGuardado={cargar} />
        </>
      )}
    </div>
  )
}
