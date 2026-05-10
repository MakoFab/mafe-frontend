'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { formatFecha } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Cuidador {
  id: string
  usuario_id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  especialidad?: string
  turno?: string
  turno_inicio?: string
  turno_fin?: string
  fecha_contrato?: string
  activo: boolean
  total_residentes: string
}

interface FormCuidador {
  nombre: string
  apellido: string
  email: string
  password: string
  telefono: string
  especialidad: string
  turno: string
  turno_inicio: string
  turno_fin: string
  fecha_contrato: string
}

const TURNO_CFG: Record<string, { label: string; cls: string }> = {
  mañana:   { label: 'Mañana',   cls: 'bg-yellow-100 text-yellow-700' },
  tarde:    { label: 'Tarde',    cls: 'bg-orange-100 text-orange-700' },
  noche:    { label: 'Noche',    cls: 'bg-indigo-100 text-indigo-700' },
  rotativo: { label: 'Rotativo', cls: 'bg-gray-100 text-gray-600' },
}

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase()
}

export default function CuidadoresPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [errorForm, setErrorForm]   = useState('')
  const [detalle, setDetalle]       = useState<Cuidador | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormCuidador>()

  async function cargar() {
    const r = await api.get<Cuidador[]>('/cuidadores')
    setCuidadores(r.data)
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  async function crear(data: FormCuidador) {
    setErrorForm('')
    setGuardando(true)
    try {
      await api.post('/cuidadores', data)
      reset()
      setModal(false)
      await cargar()
    } catch (e: any) {
      setErrorForm(e.response?.data?.error || 'Error al crear')
    } finally {
      setGuardando(false)
    }
  }

  const activos   = cuidadores.filter(c => c.activo)
  const inactivos = cuidadores.filter(c => !c.activo)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Cuidadores</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activos.length} activos · {cuidadores.reduce((s, c) => s + Number(c.total_residentes), 0)} asignaciones
          </p>
        </div>
        <button onClick={() => { setModal(true); reset() }} className="btn-primary text-sm">
          + Nuevo cuidador
        </button>
      </div>

      {cargando ? <Spinner /> : (
        <div className="space-y-6">
          {/* Activos */}
          {activos.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Activos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDetalle(c)}
                    className="card text-left hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-mafe-claro flex items-center justify-center text-mafe font-bold text-sm shrink-0">
                        {iniciales(c.nombre, c.apellido)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {c.nombre} {c.apellido}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{c.especialidad || 'Sin especialidad'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {c.turno && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TURNO_CFG[c.turno]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                              {TURNO_CFG[c.turno]?.label ?? c.turno}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {c.total_residentes} residente{Number(c.total_residentes) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-500 mb-3 text-sm">Inactivos</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inactivos.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setDetalle(c)}
                    className="card text-left opacity-60 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-sm shrink-0">
                        {iniciales(c.nombre, c.apellido)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-600 text-sm">{c.nombre} {c.apellido}</p>
                        <p className="text-xs text-gray-400">{c.especialidad}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cuidadores.length === 0 && (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">👩‍⚕️</p>
              <p className="font-medium">Sin cuidadores registrados</p>
              <p className="text-sm mt-1">Agrega el primer cuidador con el botón de arriba.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo cuidador */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h2 className="text-lg font-bold text-mafe-oscuro mb-4">Nuevo cuidador</h2>
              {errorForm && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{errorForm}</div>
              )}
              <form onSubmit={handleSubmit(crear)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input {...register('nombre', { required: 'Requerido' })} className="input-base" />
                    {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input {...register('apellido', { required: 'Requerido' })} className="input-base" />
                    {errors.apellido && <p className="text-xs text-red-500 mt-1">{errors.apellido.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico *</label>
                  <input type="email" {...register('email', { required: 'Requerido' })} className="input-base" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                    <input type="password" {...register('password', { required: 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} className="input-base" />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input {...register('telefono')} className="input-base" placeholder="3001234567" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                  <input {...register('especialidad')} className="input-base" placeholder="Auxiliar de enfermería geriátrica" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                    <select {...register('turno')} className="input-base">
                      <option value="">Sin turno</option>
                      <option value="mañana">Mañana</option>
                      <option value="tarde">Tarde</option>
                      <option value="noche">Noche</option>
                      <option value="rotativo">Rotativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
                    <input type="time" {...register('turno_inicio')} className="input-base" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
                    <input type="time" {...register('turno_fin')} className="input-base" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de contrato</label>
                  <input type="date" {...register('fecha_contrato')} className="input-base" />
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={guardando} className="btn-primary flex-1">
                    {guardando ? 'Guardando...' : 'Crear cuidador'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-2xl w-full sm:max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-mafe-claro flex items-center justify-center text-mafe font-bold text-lg">
                  {iniciales(detalle.nombre, detalle.apellido)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-mafe-oscuro">{detalle.nombre} {detalle.apellido}</h2>
                  <p className="text-sm text-gray-500">{detalle.especialidad || 'Sin especialidad'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Correo</p>
                  <p className="text-gray-700 truncate">{detalle.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Teléfono</p>
                  <p className="text-gray-700">{detalle.telefono || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Turno</p>
                  {detalle.turno
                    ? <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${TURNO_CFG[detalle.turno]?.cls}`}>
                        {TURNO_CFG[detalle.turno]?.label}
                        {detalle.turno_inicio && ` (${detalle.turno_inicio.slice(0,5)}–${detalle.turno_fin?.slice(0,5)})`}
                      </span>
                    : <p className="text-gray-500">—</p>
                  }
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Contrato desde</p>
                  <p className="text-gray-700">{detalle.fecha_contrato ? formatFecha(detalle.fecha_contrato) : '—'}</p>
                </div>
              </div>

              <div className="bg-mafe-claro rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-mafe">{detalle.total_residentes}</p>
                <p className="text-xs text-gray-600">residente{Number(detalle.total_residentes) !== 1 ? 's' : ''} asignado{Number(detalle.total_residentes) !== 1 ? 's' : ''}</p>
              </div>

              <button onClick={() => setDetalle(null)} className="btn-secondary w-full">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
