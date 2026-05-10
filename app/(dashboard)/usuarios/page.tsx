'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { etiquetaRol, formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'
import { Rol } from '@/types'

interface Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: Rol
  telefono?: string
  activo: boolean
  ultimo_acceso?: string
  creado_en: string
}

interface FormUsuario {
  nombre: string
  apellido: string
  email: string
  password: string
  rol: string
  telefono: string
}

const ROL_CFG: Record<string, { label: string; cls: string }> = {
  admin:      { label: 'Admin',      cls: 'bg-red-100 text-red-700' },
  medico:     { label: 'Médico',     cls: 'bg-purple-100 text-purple-700' },
  enfermera:  { label: 'Enfermera',  cls: 'bg-blue-100 text-blue-700' },
  cuidador:   { label: 'Cuidador',   cls: 'bg-mafe-claro text-mafe' },
  supervisor: { label: 'Supervisor', cls: 'bg-orange-100 text-orange-700' },
  familiar:   { label: 'Familiar',   cls: 'bg-gray-100 text-gray-600' },
  proveedor:  { label: 'Proveedor',  cls: 'bg-yellow-100 text-yellow-700' },
}

const ROLES: Rol[] = ['admin','medico','enfermera','cuidador','supervisor','familiar','proveedor']

function iniciales(nombre: string, apellido: string) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase()
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios]   = useState<Usuario[]>([])
  const [cargando, setCargando]   = useState(true)
  const [filtroRol, setFiltroRol] = useState('')
  const [modal, setModal]         = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState('')
  const [detalle, setDetalle]     = useState<Usuario | null>(null)
  const [toggleando, setToggleando] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormUsuario>({
    defaultValues: { rol: 'cuidador' }
  })

  async function cargar() {
    const params = filtroRol ? { rol: filtroRol } : {}
    const r = await api.get<Usuario[]>('/usuarios', { params })
    setUsuarios(r.data)
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol])

  async function crear(data: FormUsuario) {
    setErrorForm('')
    setGuardando(true)
    try {
      await api.post('/usuarios', data)
      reset()
      setModal(false)
      await cargar()
    } catch (e: any) {
      setErrorForm(e.response?.data?.error || 'Error al crear')
    } finally {
      setGuardando(false)
    }
  }

  async function toggleActivo(u: Usuario) {
    setToggleando(true)
    try {
      await api.patch(`/usuarios/${u.id}`, { activo: !u.activo })
      setDetalle(prev => prev ? { ...prev, activo: !prev.activo } : null)
      await cargar()
    } finally {
      setToggleando(false)
    }
  }

  const activos   = usuarios.filter(u => u.activo)
  const inactivos = usuarios.filter(u => !u.activo)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Usuarios del sistema</h1>
          <p className="text-sm text-gray-500 mt-0.5">{activos.length} activos de {usuarios.length} totales</p>
        </div>
        <button onClick={() => { setModal(true); reset() }} className="btn-primary text-sm">
          + Nuevo usuario
        </button>
      </div>

      {/* Filtro por rol */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFiltroRol('')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !filtroRol ? 'bg-mafe text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setFiltroRol(r)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filtroRol === r ? 'bg-mafe text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ROL_CFG[r].label}
          </button>
        ))}
      </div>

      {cargando ? <Spinner /> : (
        <div className="space-y-1">
          {activos.map(u => <FilaUsuario key={u.id} u={u} onClick={() => setDetalle(u)} />)}

          {inactivos.length > 0 && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-wide pt-4 pb-1 px-1">Inactivos</p>
              {inactivos.map(u => <FilaUsuario key={u.id} u={u} onClick={() => setDetalle(u)} dimmed />)}
            </>
          )}

          {usuarios.length === 0 && (
            <div className="card text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">👤</p>
              <p className="font-medium">Sin usuarios</p>
            </div>
          )}
        </div>
      )}

      {/* Modal nuevo */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h2 className="text-lg font-bold text-mafe-oscuro mb-4">Nuevo usuario</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                  <select {...register('rol', { required: 'Requerido' })} className="input-base">
                    {ROLES.map(r => (
                      <option key={r} value={r}>{ROL_CFG[r].label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
                  <button type="submit" disabled={guardando} className="btn-primary flex-1">
                    {guardando ? 'Guardando...' : 'Crear usuario'}
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
          <div className="bg-white rounded-2xl w-full sm:max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-mafe-claro flex items-center justify-center text-mafe font-bold">
                  {iniciales(detalle.nombre, detalle.apellido)}
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">{detalle.nombre} {detalle.apellido}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROL_CFG[detalle.rol]?.cls}`}>
                    {etiquetaRol(detalle.rol)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Correo</span>
                  <span className="text-gray-800 truncate ml-4 max-w-[180px]">{detalle.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teléfono</span>
                  <span className="text-gray-800">{detalle.telefono || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Último acceso</span>
                  <span className="text-gray-800">{detalle.ultimo_acceso ? formatFechaHora(detalle.ultimo_acceso) : 'Nunca'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado</span>
                  <span className={detalle.activo ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {detalle.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleActivo(detalle)}
                disabled={toggleando}
                className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                  detalle.activo
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                {toggleando ? '...' : detalle.activo ? 'Desactivar usuario' : 'Activar usuario'}
              </button>

              <button onClick={() => setDetalle(null)} className="btn-secondary w-full">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilaUsuario({ u, onClick, dimmed }: { u: Usuario; onClick: () => void; dimmed?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`card w-full text-left flex items-center gap-3 hover:shadow-md transition-shadow ${dimmed ? 'opacity-50' : ''}`}
    >
      <div className="w-9 h-9 rounded-full bg-mafe-claro flex items-center justify-center text-mafe font-bold text-sm shrink-0">
        {iniciales(u.nombre, u.apellido)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 text-sm">{u.nombre} {u.apellido}</p>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROL_CFG[u.rol]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
        {ROL_CFG[u.rol]?.label ?? u.rol}
      </span>
    </button>
  )
}
