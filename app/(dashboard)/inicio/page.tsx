'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { obtenerUsuario } from '@/lib/auth'
import { formatFechaHora, etiquetaRol } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface MetricasResidentes { activos: string; hospitalizados: string; dependencia_total: string }
interface MetricasMeds       { pendientes: string; administrados: string }
interface MetricasIncidentes { abiertos: string; hoy: string; graves: string }
interface MetricasVisitas    { hoy: string; confirmadas: string }
interface MetricasRegistros  { residentes_registrados: string }

interface AlertaVital {
  residente_id: string
  residente: string
  habitacion: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  temperatura?: number
  saturacion_o2?: number
  glucosa?: number
  fecha_hora: string
}

interface EventoActividad {
  tipo: 'registro' | 'incidente'
  fecha_hora: string
  residente: string
  habitacion: string
  usuario: string
  detalle: string
  severidad?: string
}

interface Metricas {
  residentes: MetricasResidentes
  medicamentos: MetricasMeds
  incidentes: MetricasIncidentes
  visitas: MetricasVisitas
  registros: MetricasRegistros
  alertas_vitales: AlertaVital[]
  actividad_reciente: EventoActividad[]
}

const SEV_COLOR: Record<string, string> = {
  leve:     'text-blue-600',
  moderado: 'text-yellow-600',
  grave:    'text-orange-600',
  critico:  'text-red-600',
}

function alertaLabel(a: AlertaVital) {
  const flags: string[] = []
  if (a.presion_sistolica && (a.presion_sistolica > 160 || a.presion_sistolica < 90))
    flags.push(`TA ${a.presion_sistolica}/${a.presion_diastolica}`)
  if (a.frecuencia_cardiaca && (a.frecuencia_cardiaca > 100 || a.frecuencia_cardiaca < 50))
    flags.push(`FC ${a.frecuencia_cardiaca}`)
  if (a.temperatura && (a.temperatura > 38 || a.temperatura < 35.5))
    flags.push(`T° ${a.temperatura}`)
  if (a.saturacion_o2 && a.saturacion_o2 < 92)
    flags.push(`SpO₂ ${a.saturacion_o2}%`)
  if (a.glucosa && (a.glucosa > 250 || a.glucosa < 70))
    flags.push(`Glucosa ${a.glucosa}`)
  return flags.join(' · ')
}

export default function InicioPage() {
  const router  = useRouter()
  const [usuario, setUsuario] = useState<ReturnType<typeof obtenerUsuario>>(null)
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    setUsuario(obtenerUsuario())
  }, [])

  useEffect(() => {
    api.get<Metricas>('/dashboard/metricas')
      .then(r => setMetricas(r.data))
      .catch(() => {/* silently ignore — metrics are non-critical */})
      .finally(() => setCargando(false))
  }, [])

  const saludoHora = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-mafe-oscuro">
          {saludoHora()}, {usuario?.nombre}
        </h1>
        <p className="text-gray-500 text-sm">
          {etiquetaRol(usuario?.rol ?? '')} · Casa Geriátrica Mafe
        </p>
      </div>

      {cargando ? <Spinner /> : metricas ? (
        <>
          {/* Tarjetas métricas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/residentes')}
              className="card border-l-4 border-l-mafe text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">Residentes activos</p>
              <p className="text-3xl font-bold text-mafe-oscuro mt-1">{metricas.residentes.activos}</p>
              {Number(metricas.residentes.hospitalizados) > 0 && (
                <p className="text-xs text-yellow-600 mt-1">{metricas.residentes.hospitalizados} hospitalizados</p>
              )}
            </button>

            <button
              onClick={() => router.push('/medicamentos')}
              className="card border-l-4 border-l-yellow-400 text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">Medicamentos pendientes</p>
              <p className="text-3xl font-bold text-mafe-oscuro mt-1">{metricas.medicamentos.pendientes}</p>
              <p className="text-xs text-gray-400 mt-1">{metricas.medicamentos.administrados} administrados hoy</p>
            </button>

            <button
              onClick={() => router.push('/incidentes')}
              className={`card border-l-4 text-left hover:shadow-md transition-shadow ${
                Number(metricas.incidentes.graves) > 0 ? 'border-l-red-500' : 'border-l-orange-400'
              }`}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">Incidentes abiertos</p>
              <p className="text-3xl font-bold text-mafe-oscuro mt-1">{metricas.incidentes.abiertos}</p>
              {Number(metricas.incidentes.graves) > 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">{metricas.incidentes.graves} graves/críticos</p>
              )}
            </button>

            <button
              onClick={() => router.push('/registros')}
              className="card border-l-4 border-l-blue-400 text-left hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">Visitas hoy</p>
              <p className="text-3xl font-bold text-mafe-oscuro mt-1">{metricas.visitas.hoy}</p>
              <p className="text-xs text-gray-400 mt-1">{metricas.visitas.confirmadas} confirmadas</p>
            </button>
          </div>

          {/* Alertas vitales */}
          {metricas.alertas_vitales.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Alertas de signos vitales (últimas 24h)
              </h2>
              <div className="space-y-2">
                {metricas.alertas_vitales.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(`/residentes/${a.residente_id}/vitales`)}
                    className="card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow border border-red-100"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-600 text-sm font-bold">
                        {a.residente.split(' ')[0][0]}{a.residente.split(' ')[1]?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm">{a.residente}</p>
                      <p className="text-xs text-red-600 font-medium truncate">{alertaLabel(a)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Hab. {a.habitacion}</p>
                      <p className="text-xs text-gray-400">{formatFechaHora(a.fecha_hora)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Registros turno */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800">Registros de turno (hoy)</p>
              <button
                onClick={() => router.push('/registros/nuevo')}
                className="text-xs text-mafe font-medium hover:underline"
              >
                + Nuevo registro
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-mafe h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(
                      (Number(metricas.registros.residentes_registrados) / Math.max(1, Number(metricas.residentes.activos))) * 100
                    ))}%`
                  }}
                />
              </div>
              <p className="text-sm font-medium text-gray-700 shrink-0">
                {metricas.registros.residentes_registrados} / {metricas.residentes.activos}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-1">residentes con registro hoy</p>
          </div>

          {/* Actividad reciente */}
          {metricas.actividad_reciente.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-2">Actividad reciente (12h)</h2>
              <div className="card divide-y divide-gray-50">
                {metricas.actividad_reciente.map((e, i) => (
                  <div key={i} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      e.tipo === 'incidente' ? 'bg-orange-100 text-orange-600' : 'bg-mafe-claro text-mafe'
                    }`}>
                      {e.tipo === 'incidente' ? '!' : '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-gray-800">{e.residente}</p>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">Hab. {e.habitacion}</span>
                        {e.tipo === 'incidente' && e.severidad && (
                          <span className={`text-xs font-medium capitalize ${SEV_COLOR[e.severidad] ?? ''}`}>
                            {e.severidad}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 capitalize">{e.tipo} · {e.detalle} · {e.usuario}</p>
                    </div>
                    <p className="text-xs text-gray-400 shrink-0">{formatFechaHora(e.fecha_hora)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* fallback sin métricas */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {['Residentes activos','Medicamentos pendientes','Incidentes abiertos','Visitas hoy'].map(label => (
            <div key={label} className="card">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-gray-300 mt-1">—</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
