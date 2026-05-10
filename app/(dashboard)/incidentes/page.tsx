'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { obtenerUsuario } from '@/lib/auth'
import { formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Incidente {
  id: string
  residente_id: string
  residente_nombre: string
  habitacion: string
  tipo: string
  severidad: 'leve' | 'moderado' | 'grave' | 'critico'
  descripcion: string
  accion_tomada?: string
  notificado_familia: boolean
  notificado_medico: boolean
  resuelto: boolean
  resuelto_en?: string
  resuelto_por_nombre?: string
  reportado_por_nombre: string
  fecha_hora: string
}

interface Residente { id: string; nombre: string; apellido: string }

interface FormCrear {
  residente_id: string
  tipo: string
  severidad: string
  descripcion: string
  accion_tomada: string
  notificado_familia: boolean
  notificado_medico: boolean
}

const SEV_CFG = {
  leve:     { label: 'Leve',     cls: 'bg-blue-100 text-blue-700' },
  moderado: { label: 'Moderado', cls: 'bg-yellow-100 text-yellow-700' },
  grave:    { label: 'Grave',    cls: 'bg-orange-100 text-orange-700' },
  critico:  { label: 'Crítico',  cls: 'bg-red-100 text-red-700' },
}

const TIPO_OPTS = [
  'caida', 'medicamento', 'comportamiento', 'lesion', 'fuga', 'queja', 'otro',
]

const TIPO_LABEL: Record<string, string> = {
  caida:         'Caída',
  medicamento:   'Medicamento',
  comportamiento:'Comportamiento',
  lesion:        'Lesión',
  fuga:          'Fuga',
  queja:         'Queja',
  otro:          'Otro',
}

const SEV_OPTS = ['leve', 'moderado', 'grave', 'critico']

export default function IncidentesPage() {
  const [canResolve, setCanResolve] = useState(false)
  const [incidentes, setIncidentes] = useState<Incidente[]>([])
  const [residentes, setResidentes] = useState<Residente[]>([])
  const [cargando, setCargando]     = useState(true)
  const [filtroResuelto, setFiltroResuelto] = useState<'todos'|'abiertos'|'resueltos'>('abiertos')
  const [filtroSev, setFiltroSev]   = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [modalDetalle, setModalDetalle] = useState<Incidente | null>(null)
  const [guardando, setGuardando]   = useState(false)
  const [errorForm, setErrorForm]   = useState('')
  const [accionResolucion, setAccionResolucion] = useState('')
  const [resolviendo, setResolviendo] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormCrear>({
    defaultValues: { tipo: 'otro', severidad: 'leve', notificado_familia: false, notificado_medico: false }
  })

  useEffect(() => {
    const u = obtenerUsuario()
    setCanResolve(['admin','supervisor','medico','enfermera'].includes(u?.rol ?? ''))
  }, [])

  async function cargar() {
    const params: Record<string, string> = {}
    if (filtroResuelto === 'abiertos')   params.resuelto = 'false'
    if (filtroResuelto === 'resueltos')  params.resuelto = 'true'
    if (filtroSev) params.severidad = filtroSev
    const r = await api.get<Incidente[]>('/incidentes', { params: { ...params, limit: '100' } })
    setIncidentes(r.data)
  }

  useEffect(() => {
    Promise.all([
      cargar(),
      api.get<Residente[]>('/residentes').then(r => setResidentes(r.data)),
    ]).finally(() => setCargando(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroResuelto, filtroSev])

  async function crear(data: FormCrear) {
    setErrorForm('')
    setGuardando(true)
    try {
      await api.post('/incidentes', data)
      reset()
      setModalCrear(false)
      await cargar()
    } catch (e: any) {
      setErrorForm(e.response?.data?.error || 'Error al registrar')
    } finally {
      setGuardando(false)
    }
  }

  async function resolver() {
    if (!modalDetalle) return
    setResolviendo(true)
    try {
      const r = await api.patch<Incidente>(`/incidentes/${modalDetalle.id}/resolver`, {
        accion_tomada: accionResolucion || undefined,
      })
      setModalDetalle(r.data)
      setAccionResolucion('')
      await cargar()
    } finally {
      setResolviendo(false)
    }
  }

  const abiertos  = incidentes.filter(i => !i.resuelto).length
  const graves    = incidentes.filter(i => !i.resuelto && ['grave','critico'].includes(i.severidad)).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Incidentes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {abiertos} abiertos
            {graves > 0 && <span className="ml-2 text-red-600 font-medium">· {graves} graves/críticos</span>}
          </p>
        </div>
        <button onClick={() => { setModalCrear(true); reset() }} className="btn-primary text-sm">
          + Reportar incidente
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['todos','abiertos','resueltos'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltroResuelto(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filtroResuelto === f
                ? 'bg-mafe text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={filtroSev}
            onChange={e => setFiltroSev(e.target.value)}
            className="input-base py-1 text-sm"
          >
            <option value="">Todas las severidades</option>
            {SEV_OPTS.map(s => (
              <option key={s} value={s}>{SEV_CFG[s as keyof typeof SEV_CFG].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {cargando ? <Spinner /> : (
        <>
          {incidentes.length === 0 ? (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-medium">Sin incidentes</p>
              <p className="text-sm mt-1">No hay incidentes con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incidentes.map(inc => {
                const sev = SEV_CFG[inc.severidad] ?? SEV_CFG.leve
                return (
                  <button
                    key={inc.id}
                    onClick={() => { setModalDetalle(inc); setAccionResolucion('') }}
                    className="card w-full text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Severity dot */}
                      <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                        inc.severidad === 'critico' ? 'bg-red-500' :
                        inc.severidad === 'grave'   ? 'bg-orange-500' :
                        inc.severidad === 'moderado'? 'bg-yellow-500' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{inc.residente_nombre}</p>
                          <span className="text-gray-400 text-xs">Hab. {inc.habitacion}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sev.cls}`}>
                            {sev.label}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {TIPO_LABEL[inc.tipo] ?? inc.tipo}
                          </span>
                          {inc.resuelto && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Resuelto
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{inc.descripcion}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatFechaHora(inc.fecha_hora)} · {inc.reportado_por_nombre}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal crear */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h2 className="text-lg font-bold text-mafe-oscuro mb-4">Reportar incidente</h2>
              {errorForm && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{errorForm}</div>
              )}
              <form onSubmit={handleSubmit(crear)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residente *</label>
                  <select
                    {...register('residente_id', { required: 'Requerido' })}
                    className="input-base"
                  >
                    <option value="">Seleccionar...</option>
                    {residentes.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre} {r.apellido}</option>
                    ))}
                  </select>
                  {errors.residente_id && <p className="text-xs text-red-500 mt-1">{errors.residente_id.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select {...register('tipo')} className="input-base">
                      {TIPO_OPTS.map(t => (
                        <option key={t} value={t}>{TIPO_LABEL[t]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
                    <select {...register('severidad')} className="input-base">
                      {SEV_OPTS.map(s => (
                        <option key={s} value={s}>{SEV_CFG[s as keyof typeof SEV_CFG].label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                  <textarea
                    {...register('descripcion', { required: 'Requerido' })}
                    rows={3}
                    className="input-base resize-none"
                    placeholder="Describe lo ocurrido..."
                  />
                  {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acción tomada</label>
                  <textarea
                    {...register('accion_tomada')}
                    rows={2}
                    className="input-base resize-none"
                    placeholder="Medidas tomadas inmediatamente..."
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" {...register('notificado_familia')} className="rounded text-mafe" />
                    Familia notificada
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" {...register('notificado_medico')} className="rounded text-mafe" />
                    Médico notificado
                  </label>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModalCrear(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" disabled={guardando} className="btn-primary flex-1">
                    {guardando ? 'Guardando...' : 'Registrar incidente'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {modalDetalle && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-5 space-y-4">
              {/* Header detalle */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-mafe-oscuro">{modalDetalle.residente_nombre}</h2>
                  <p className="text-sm text-gray-500">Hab. {modalDetalle.habitacion} · {formatFechaHora(modalDetalle.fecha_hora)}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEV_CFG[modalDetalle.severidad].cls}`}>
                    {SEV_CFG[modalDetalle.severidad].label}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                    {modalDetalle.tipo}
                  </span>
                </div>
              </div>

              {/* Descripcion */}
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Descripción</p>
                <p className="text-sm text-gray-800">{modalDetalle.descripcion}</p>
              </div>

              {modalDetalle.accion_tomada && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Acción tomada</p>
                  <p className="text-sm text-gray-800">{modalDetalle.accion_tomada}</p>
                </div>
              )}

              {/* Notificaciones */}
              <div className="flex gap-3">
                <span className={`text-xs px-2 py-1 rounded-full ${modalDetalle.notificado_familia ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {modalDetalle.notificado_familia ? '✓' : '·'} Familia
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${modalDetalle.notificado_medico ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {modalDetalle.notificado_medico ? '✓' : '·'} Médico
                </span>
              </div>

              <p className="text-xs text-gray-400">Reportado por: {modalDetalle.reportado_por_nombre}</p>

              {/* Resolución */}
              {modalDetalle.resuelto ? (
                <div className="bg-green-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-green-800">Resuelto</p>
                  {modalDetalle.resuelto_en && (
                    <p className="text-xs text-green-600 mt-0.5">{formatFechaHora(modalDetalle.resuelto_en)} · {modalDetalle.resuelto_por_nombre}</p>
                  )}
                </div>
              ) : canResolve && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Resolver incidente</p>
                  <textarea
                    value={accionResolucion}
                    onChange={e => setAccionResolucion(e.target.value)}
                    rows={2}
                    className="input-base resize-none mb-3"
                    placeholder="Acción tomada para resolución (opcional)..."
                  />
                  <button
                    onClick={resolver}
                    disabled={resolviendo}
                    className="btn-primary w-full"
                  >
                    {resolviendo ? 'Procesando...' : 'Marcar como resuelto'}
                  </button>
                </div>
              )}

              <button onClick={() => setModalDetalle(null)} className="btn-secondary w-full">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
