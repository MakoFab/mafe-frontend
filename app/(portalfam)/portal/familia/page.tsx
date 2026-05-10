'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { formatFecha, formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

// ── tipos ────────────────────────────────────────────────────
interface Residente {
  residente_id: string
  residente_nombre: string
  habitacion: string
  edad: number
  parentesco: string
  diagnosticos?: string
}

interface Registro {
  turno: string
  fecha_hora: string
  estado_emocional: string
  desayuno_pct?: number
  almuerzo_pct?: number
  cena_pct?: number
  hidratacion?: string
  bano_realizado?: boolean
  higiene_oral?: boolean
  cambio_ropa?: boolean
  movilidad?: string
  actividad_fisica?: string
  observaciones?: string
  novedades?: string
  cuidador: string
}

interface Medicamento {
  nombre: string
  dosis: string
  unidad: string
  frecuencia: string
  horarios?: string
  via?: string
  con_comida: boolean
  estado: 'administrado' | 'pendiente' | 'omitido'
  administrado_en?: string
}

interface VitalDia {
  dia: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  saturacion_o2?: number
  temperatura?: number
  glucosa?: number
  peso?: number
  fecha_hora: string
}

interface EstadoDia { dia: string; estado_emocional: string }

interface Visita {
  fecha_hora: string
  duracion_min?: number
  estado: string
  notas?: string
  tipo: string
}

interface Foto {
  url_archivo: string
  thumbnail_url?: string
  descripcion?: string
  actividad?: string
  subido_en: string
  subido_por: string
}

interface Dashboard {
  residente: Residente
  registros_hoy: Registro[]
  medicamentos: Medicamento[]
  vitales_semana: VitalDia[]
  estado_semana: EstadoDia[]
  proximas_visitas: Visita[]
  fotos_recientes: Foto[]
  mensajes_no_leidos: number
}

// ── config ───────────────────────────────────────────────────
const MOOD: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  tranquilo: { emoji: '😌', label: 'Tranquilo',  bg: 'bg-green-100',  text: 'text-green-700' },
  activo:    { emoji: '😄', label: 'Activo',     bg: 'bg-yellow-100', text: 'text-yellow-700' },
  agitado:   { emoji: '😤', label: 'Agitado',    bg: 'bg-orange-100', text: 'text-orange-700' },
  triste:    { emoji: '😔', label: 'Triste',     bg: 'bg-blue-100',   text: 'text-blue-700' },
  ansioso:   { emoji: '😰', label: 'Ansioso',    bg: 'bg-purple-100', text: 'text-purple-700' },
  confuso:   { emoji: '😕', label: 'Confuso',    bg: 'bg-gray-100',   text: 'text-gray-600' },
  dormido:   { emoji: '😴', label: 'Dormido',    bg: 'bg-gray-100',   text: 'text-gray-500' },
}

const MED_CFG = {
  administrado: { label: 'Dado',     cls: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  pendiente:    { label: 'Pendiente',cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  omitido:      { label: 'Omitido',  cls: 'bg-red-100 text-red-600',       dot: 'bg-red-400' },
}

type VColor = 'green' | 'yellow' | 'red' | 'gray'
const V_CLS: Record<VColor, string> = {
  green:  'bg-green-50  border-green-200  text-green-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red:    'bg-red-50    border-red-200    text-red-600',
  gray:   'bg-gray-50   border-gray-200   text-gray-400',
}
const V_LABEL_CLS: Record<VColor, string> = {
  green:  'text-green-500',
  yellow: 'text-yellow-500',
  red:    'text-red-500',
  gray:   'text-gray-400',
}

function vColor(campo: string, val?: number | null): VColor {
  if (val == null) return 'gray'
  switch (campo) {
    case 'presion_sistolica':
      return val >= 160 || val < 90  ? 'red' : val >= 140 ? 'yellow' : 'green'
    case 'presion_diastolica':
      return val >= 100 || val < 60  ? 'red' : val >= 90  ? 'yellow' : 'green'
    case 'frecuencia_cardiaca':
      return val < 50  || val > 110  ? 'red' : (val < 60 || val > 100) ? 'yellow' : 'green'
    case 'saturacion_o2':
      return val < 92  ? 'red' : val < 95 ? 'yellow' : 'green'
    case 'temperatura':
      return val > 38.5 || val < 35.5 ? 'red' : (val > 37.5 || val < 36.0) ? 'yellow' : 'green'
    case 'glucosa':
      return val < 60  || val > 250  ? 'red' : (val < 70 || val > 180) ? 'yellow' : 'green'
    default: return 'green'
  }
}

function taColor(s?: number | null, d?: number | null): VColor {
  const cs = vColor('presion_sistolica', s)
  const cd = vColor('presion_diastolica', d)
  if (cs === 'red' || cd === 'red') return 'red'
  if (cs === 'yellow' || cd === 'yellow') return 'yellow'
  if (s == null && d == null) return 'gray'
  return 'green'
}

function ultimos7Dias(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function diaSemana(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')
}

function PctBar({ pct, label }: { pct?: number; label: string }) {
  if (pct == null) return null
  const cls = pct >= 75 ? 'bg-green-400' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── componente ───────────────────────────────────────────────
export default function PortalFamiliaPage() {
  const router  = useRouter()
  const [data, setData]     = useState<Dashboard | null>(null)
  const [cargando, setCargando] = useState(true)
  const [fotoAmpliada, setFotoAmpliada] = useState<Foto | null>(null)

  useEffect(() => {
    api.get<Dashboard>('/familia/dashboard')
      .then(r => setData(r.data))
      .catch(() => { /* auth redirect handled by axios interceptor */ })
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner />
    </div>
  )

  if (!data) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-4xl mb-3">⚠️</p>
      <p>No se pudo cargar la información.</p>
    </div>
  )

  const { residente, registros_hoy, medicamentos, vitales_semana,
          estado_semana, proximas_visitas, fotos_recientes, mensajes_no_leidos } = data

  const vitalesHoy  = vitales_semana[0] ?? null
  const registroHoy = registros_hoy[0]  ?? null
  const semana      = ultimos7Dias()
  const estadoMap   = Object.fromEntries(estado_semana.map(e => [e.dia, e.estado_emocional]))
  const moodhoy     = registroHoy?.estado_emocional ?? null

  const medsDados    = medicamentos.filter(m => m.estado === 'administrado').length
  const medsPendient = medicamentos.filter(m => m.estado === 'pendiente').length

  return (
    <div className="space-y-4">

      {/* ── TARJETA RESIDENTE ── */}
      <div className="bg-mafe-oscuro text-white rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-xl shrink-0">
            {residente.residente_nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">{residente.residente_nombre}</h1>
            <p className="text-white/70 text-sm">
              Habitación {residente.habitacion} · {residente.edad} años · {residente.parentesco}
            </p>
            {moodhoy && (
              <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-sm font-medium ${MOOD[moodhoy]?.bg} ${MOOD[moodhoy]?.text}`}>
                <span>{MOOD[moodhoy]?.emoji}</span>
                <span>{MOOD[moodhoy]?.label} hoy</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ESTADO EMOCIONAL SEMANA ── */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">Estado emocional esta semana</h2>
        <div className="flex justify-between">
          {semana.map((dia, i) => {
            const estado = estadoMap[dia]
            const cfg    = estado ? MOOD[estado] : null
            const esHoy  = i === 6
            return (
              <div key={dia} className="flex flex-col items-center gap-1">
                <span className={`text-xs font-medium ${esHoy ? 'text-mafe' : 'text-gray-400'}`}>
                  {diaSemana(dia)}
                </span>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg
                  ${cfg ? cfg.bg : 'bg-gray-100'}
                  ${esHoy ? 'ring-2 ring-mafe ring-offset-1' : ''}`}
                >
                  {cfg ? cfg.emoji : <span className="text-gray-300 text-xs">—</span>}
                </div>
                {cfg && (
                  <span className={`text-xs font-medium ${cfg.text} leading-none hidden sm:block`}>
                    {cfg.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>
        {!Object.keys(estadoMap).length && (
          <p className="text-center text-xs text-gray-400 mt-2">Sin registros esta semana</p>
        )}
      </div>

      {/* ── SIGNOS VITALES ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-sm">Signos vitales</h2>
          {vitalesHoy && (
            <span className="text-xs text-gray-400">
              {formatFechaHora(vitalesHoy.fecha_hora)}
            </span>
          )}
        </div>
        {vitalesHoy ? (
          <div className="grid grid-cols-3 gap-2">
            {/* TA */}
            {(() => {
              const c = taColor(vitalesHoy.presion_sistolica, vitalesHoy.presion_diastolica)
              return (
                <div className={`rounded-xl border p-2.5 text-center ${V_CLS[c]}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${V_LABEL_CLS[c]}`}>T. Arterial</p>
                  <p className="text-sm font-bold leading-none">
                    {vitalesHoy.presion_sistolica ?? '—'}/{vitalesHoy.presion_diastolica ?? '—'}
                  </p>
                  <p className="text-xs mt-0.5 opacity-70">mmHg</p>
                </div>
              )
            })()}
            {/* FC */}
            {(() => {
              const c = vColor('frecuencia_cardiaca', vitalesHoy.frecuencia_cardiaca)
              return (
                <div className={`rounded-xl border p-2.5 text-center ${V_CLS[c]}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${V_LABEL_CLS[c]}`}>Pulso</p>
                  <p className="text-sm font-bold leading-none">{vitalesHoy.frecuencia_cardiaca ?? '—'}</p>
                  <p className="text-xs mt-0.5 opacity-70">lpm</p>
                </div>
              )
            })()}
            {/* SpO2 */}
            {(() => {
              const c = vColor('saturacion_o2', vitalesHoy.saturacion_o2)
              return (
                <div className={`rounded-xl border p-2.5 text-center ${V_CLS[c]}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${V_LABEL_CLS[c]}`}>Oxígeno</p>
                  <p className="text-sm font-bold leading-none">{vitalesHoy.saturacion_o2 ?? '—'}</p>
                  <p className="text-xs mt-0.5 opacity-70">%</p>
                </div>
              )
            })()}
            {/* Temperatura */}
            {(() => {
              const c = vColor('temperatura', vitalesHoy.temperatura)
              return (
                <div className={`rounded-xl border p-2.5 text-center ${V_CLS[c]}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${V_LABEL_CLS[c]}`}>Temperatura</p>
                  <p className="text-sm font-bold leading-none">{vitalesHoy.temperatura ?? '—'}</p>
                  <p className="text-xs mt-0.5 opacity-70">°C</p>
                </div>
              )
            })()}
            {/* Glucosa */}
            {vitalesHoy.glucosa != null && (() => {
              const c = vColor('glucosa', vitalesHoy.glucosa)
              return (
                <div className={`rounded-xl border p-2.5 text-center ${V_CLS[c]}`}>
                  <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${V_LABEL_CLS[c]}`}>Glucosa</p>
                  <p className="text-sm font-bold leading-none">{vitalesHoy.glucosa}</p>
                  <p className="text-xs mt-0.5 opacity-70">mg/dL</p>
                </div>
              )
            })()}
            {/* Peso */}
            {vitalesHoy.peso != null && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-center">
                <p className="text-xs font-medium uppercase tracking-wide mb-1 text-gray-400">Peso</p>
                <p className="text-sm font-bold text-gray-700 leading-none">{vitalesHoy.peso}</p>
                <p className="text-xs text-gray-400 mt-0.5">kg</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-4">Sin registro de signos vitales hoy</p>
        )}

        {/* Leyenda */}
        <div className="flex gap-3 mt-3 justify-center flex-wrap">
          <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Normal</span>
          <span className="flex items-center gap-1 text-xs text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Atención</span>
          <span className="flex items-center gap-1 text-xs text-red-600"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Alerta</span>
        </div>
      </div>

      {/* ── MEDICAMENTOS HOY ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-sm">Medicamentos del día</h2>
          <div className="flex gap-2 text-xs">
            <span className="text-green-600 font-medium">{medsDados} dados</span>
            {medsPendient > 0 && <span className="text-yellow-600 font-medium">{medsPendient} pendientes</span>}
          </div>
        </div>
        {medicamentos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-3">Sin medicamentos activos</p>
        ) : (
          <div className="space-y-2">
            {medicamentos.map((m, i) => {
              const cfg = MED_CFG[m.estado]
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{m.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {m.dosis} {m.unidad} · {m.frecuencia}
                      {m.con_comida && ' · Con comida'}
                    </p>
                    {m.horarios && <p className="text-xs text-gray-400">{m.horarios}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── REGISTRO DEL DÍA ── */}
      {registros_hoy.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">
            Reporte del cuidador hoy
          </h2>
          {registros_hoy.map((r, i) => (
            <div key={i} className={`${i > 0 ? 'border-t border-gray-50 pt-3 mt-3' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-mafe capitalize">{r.turno}</span>
                <span className="text-xs text-gray-400">{r.cuidador}</span>
              </div>

              {/* Alimentación */}
              {(r.desayuno_pct != null || r.almuerzo_pct != null || r.cena_pct != null) && (
                <div className="space-y-1.5 mb-3">
                  <p className="text-xs text-gray-500 font-medium">Alimentación</p>
                  <PctBar pct={r.desayuno_pct} label="Desayuno" />
                  <PctBar pct={r.almuerzo_pct} label="Almuerzo" />
                  <PctBar pct={r.cena_pct}     label="Cena" />
                </div>
              )}

              {/* Higiene y actividad */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {r.bano_realizado  && <Tag icon="🛁" label="Baño" />}
                {r.higiene_oral    && <Tag icon="🦷" label="Higiene oral" />}
                {r.cambio_ropa     && <Tag icon="👕" label="Cambio ropa" />}
                {r.movilidad       && <Tag icon="🚶" label={r.movilidad} />}
                {r.hidratacion     && <Tag icon="💧" label={`Hidratación ${r.hidratacion}`} />}
              </div>

              {r.actividad_fisica && (
                <p className="text-xs text-gray-600 mb-1">🏃 {r.actividad_fisica}</p>
              )}
              {r.observaciones && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5 mt-2">
                  {r.observaciones}
                </p>
              )}
              {r.novedades && (
                <p className="text-xs text-orange-700 bg-orange-50 rounded-lg p-2 mt-1.5">
                  ⚠️ {r.novedades}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {registros_hoy.length === 0 && (
        <div className="card text-center py-6 text-gray-400">
          <p className="text-2xl mb-1">📋</p>
          <p className="text-sm">Sin registros del cuidador por el momento</p>
        </div>
      )}

      {/* ── PRÓXIMAS VISITAS ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800 text-sm">Próximas visitas</h2>
          <button
            onClick={() => router.push('/portal/familia/visitas')}
            className="text-xs text-mafe font-medium"
          >
            Ver todas
          </button>
        </div>
        {proximas_visitas.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            <p className="text-sm">Sin visitas agendadas</p>
            <button
              onClick={() => router.push('/portal/familia/visitas')}
              className="text-xs text-mafe font-medium mt-1 underline"
            >
              Agendar visita
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {proximas_visitas.map((v, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className="w-10 h-10 bg-mafe-claro rounded-xl flex flex-col items-center justify-center shrink-0">
                  <p className="text-sm font-bold text-mafe-oscuro leading-none">
                    {new Date(v.fecha_hora).getDate()}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {new Date(v.fecha_hora).toLocaleDateString('es-CO', { month: 'short' })}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{formatFechaHora(v.fecha_hora)}</p>
                  {v.notas && <p className="text-xs text-gray-500 line-clamp-1">{v.notas}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                  v.estado === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {v.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOTOS RECIENTES ── */}
      {fotos_recientes.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Fotos recientes</h2>
            <button
              onClick={() => router.push('/portal/familia/fotos')}
              className="text-xs text-mafe font-medium"
            >
              Ver galería
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {fotos_recientes.slice(0, 6).map((f, i) => (
              <button
                key={i}
                onClick={() => setFotoAmpliada(f)}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group"
              >
                <img
                  src={f.thumbnail_url ?? f.url_archivo}
                  alt={f.descripcion ?? ''}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                {f.actividad && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-1">
                    <p className="text-white text-xs truncate">{f.actividad}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ACCESO A MENSAJES ── */}
      <button
        onClick={() => router.push('/portal/familia/mensajes')}
        className="card w-full flex items-center gap-3 hover:shadow-md transition-shadow"
      >
        <div className="relative shrink-0">
          <span className="text-3xl">💬</span>
          {mensajes_no_leidos > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {mensajes_no_leidos}
            </span>
          )}
        </div>
        <div className="text-left">
          <p className="font-semibold text-gray-800">Mensajes del equipo de cuidado</p>
          <p className="text-xs text-gray-500">
            {mensajes_no_leidos > 0
              ? `${mensajes_no_leidos} mensaje${mensajes_no_leidos > 1 ? 's' : ''} sin leer`
              : 'Toca para ver la conversación'}
          </p>
        </div>
        <span className="ml-auto text-gray-300">›</span>
      </button>

      {/* ── MODAL FOTO ── */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setFotoAmpliada(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={fotoAmpliada.url_archivo}
              alt={fotoAmpliada.descripcion ?? ''}
              className="w-full object-contain max-h-64"
            />
            <div className="p-4">
              {fotoAmpliada.actividad  && <p className="font-semibold text-gray-800">{fotoAmpliada.actividad}</p>}
              {fotoAmpliada.descripcion && <p className="text-sm text-gray-500 mt-0.5">{fotoAmpliada.descripcion}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {formatFechaHora(fotoAmpliada.subido_en)} · {fotoAmpliada.subido_por}
              </p>
              <button onClick={() => setFotoAmpliada(null)} className="mt-3 btn-secondary w-full">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      {icon} {label}
    </span>
  )
}
