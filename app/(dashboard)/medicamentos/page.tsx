'use client'
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { obtenerUsuario } from '@/lib/auth'
import { MedItem } from '@/components/medicamentos/MedRow'
import MARTable from '@/components/medicamentos/MARTable'
import Spinner from '@/components/ui/Spinner'
import { Residente } from '@/types'

/* ──────────────────────────────────────────
   Modal: Prescribir nuevo medicamento
────────────────────────────────────────── */
interface PrescribirCampos {
  residente_id: string
  nombre: string
  principio_activo: string
  dosis: string
  unidad: string
  frecuencia: string
  via: string
  horarios: string
  con_comida: boolean
  fecha_inicio: string
  fecha_fin: string
  observaciones: string
}

function ModalPrescribir({
  residentes,
  onGuardado,
  onCerrar,
}: {
  residentes: Residente[]
  onGuardado: () => void
  onCerrar: () => void
}) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<PrescribirCampos>({
    defaultValues: { fecha_inicio: new Date().toISOString().slice(0, 10) },
  })

  async function onSubmit(data: PrescribirCampos) {
    setError('')
    setGuardando(true)
    try {
      await api.post('/medicamentos', data)
      onGuardado()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al prescribir')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCerrar}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-mafe-oscuro">Prescribir medicamento</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Residente *</label>
            <select {...register('residente_id', { required: true })} className="input-base">
              <option value="">Seleccionar...</option>
              {residentes.map(r => (
                <option key={r.id} value={r.id}>{r.nombre} {r.apellido} — Hab. {r.habitacion ?? '?'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del medicamento *</label>
              <input {...register('nombre', { required: true })} className="input-base" placeholder="Ej: Metformina" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Principio activo</label>
              <input {...register('principio_activo')} className="input-base" placeholder="Ej: Metformina clorhidrato" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosis *</label>
              <input {...register('dosis', { required: true })} className="input-base" placeholder="500" />
              {errors.dosis && <p className="text-xs text-red-500 mt-1">Requerido</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
              <select {...register('unidad')} className="input-base">
                <option value="">Seleccionar</option>
                {['mg','ml','mcg','UI','tableta','cápsula','gotas','puff','sobre'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia *</label>
              <input {...register('frecuencia', { required: true })} className="input-base" placeholder="Ej: Cada 12 horas" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vía</label>
              <select {...register('via')} className="input-base">
                <option value="">Seleccionar</option>
                {['oral','intravenosa','intramuscular','subcutanea','topica','inhalatoria','otra'].map(v => (
                  <option key={v} value={v} className="capitalize">{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
              <input {...register('horarios')} className="input-base" placeholder="8:00 am, 8:00 pm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input type="date" {...register('fecha_inicio')} className="input-base" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input type="date" {...register('fecha_fin')} className="input-base" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('con_comida')} className="w-4 h-4 accent-mafe-oscuro" />
            <span className="text-sm">Administrar con comida</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea {...register('observaciones')} rows={2} className="input-base resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary flex-1">
              {guardando ? 'Guardando...' : 'Prescribir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────
   Página principal MAR
────────────────────────────────────────── */
export default function MedicamentosPage() {
  const [items, setItems] = useState<MedItem[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState<'todos' | 'pendiente' | 'administrado' | 'omitido'>('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [residentes,       setResidentes]       = useState<Residente[]>([])
  const [puedeAdministrar, setPuedeAdministrar] = useState(false)
  const [puedePrescribir,  setPuedePrescribir]  = useState(false)

  useEffect(() => {
    const u = obtenerUsuario()
    setPuedeAdministrar(['cuidador', 'enfermera', 'medico', 'admin', 'supervisor'].includes(u?.rol ?? ''))
    setPuedePrescribir(['medico', 'admin'].includes(u?.rol ?? ''))
  }, [])

  const cargar = useCallback(() => {
    setCargando(true)
    api.get<MedItem[]>('/medicamentos')
      .then(r => setItems(r.data))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (puedePrescribir) {
      api.get<Residente[]>('/residentes?estado=activo').then(r => setResidentes(r.data))
    }
  }, [puedePrescribir])

  function onActualizado(id: string, estado: 'administrado' | 'omitido', motivo?: string) {
    setItems(prev => prev.map(m =>
      m.medicamento_id === id
        ? { ...m, estado, motivo_omision: motivo }
        : m
    ))
  }

  const itemsFiltrados = filtro === 'todos' ? items : items.filter(m => m.estado === filtro)

  const stats = {
    total:        items.length,
    pendientes:   items.filter(m => m.estado === 'pendiente').length,
    administrados:items.filter(m => m.estado === 'administrado').length,
    omitidos:     items.filter(m => m.estado === 'omitido').length,
  }
  const pctCompletado = stats.total > 0
    ? Math.round(((stats.administrados + stats.omitidos) / stats.total) * 100)
    : 0

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-mafe-oscuro">Medicamentos — MAR</h1>
          <p className="text-sm text-gray-500">Registro de Administración de Medicamentos · Hoy</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} className="btn-secondary text-sm">↻ Actualizar</button>
          {puedePrescribir && (
            <button onClick={() => setModalAbierto(true)} className="btn-primary text-sm">
              + Prescribir
            </button>
          )}
        </div>
      </div>

      {/* Barra de progreso del día */}
      {!cargando && stats.total > 0 && (
        <div className="card mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Progreso del día</p>
            <p className="text-sm font-bold text-mafe-oscuro">{pctCompletado}% completado</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
            <div
              className="bg-mafe h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pctCompletado}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="bg-yellow-50 rounded-lg p-2">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              <p className="text-yellow-700">Pendientes</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-2xl font-bold text-green-600">{stats.administrados}</p>
              <p className="text-green-700">Administrados</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-2xl font-bold text-red-500">{stats.omitidos}</p>
              <p className="text-red-600">Omitidos</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {(['todos', 'pendiente', 'administrado', 'omitido'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              filtro === f
                ? 'bg-mafe text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'todos' ? `Todos (${stats.total})` :
             f === 'pendiente' ? `Pendientes (${stats.pendientes})` :
             f === 'administrado' ? `Administrados (${stats.administrados})` :
             `Omitidos (${stats.omitidos})`}
          </button>
        ))}
      </div>

      {cargando ? <Spinner /> : (
        <MARTable
          items={itemsFiltrados}
          onActualizado={onActualizado}
          puedeAdministrar={puedeAdministrar}
        />
      )}

      {modalAbierto && (
        <ModalPrescribir
          residentes={residentes}
          onGuardado={() => { setModalAbierto(false); cargar() }}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
