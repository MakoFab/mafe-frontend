'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import { formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Visita {
  id: string
  fecha_hora: string
  estado: 'pendiente' | 'confirmada' | 'realizada' | 'cancelada'
  notas?: string
}

const ESTADO_CFG = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-yellow-100 text-yellow-700' },
  confirmada: { label: 'Confirmada', cls: 'bg-green-100  text-green-700' },
  realizada:  { label: 'Realizada',  cls: 'bg-gray-100   text-gray-600' },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-100    text-red-500' },
}

interface AgendarCampos { fecha_hora: string; notas: string }

export default function VisitasFamiliaPage() {
  const [visitas, setVisitas]       = useState<Visita[]>([])
  const [cargando, setCargando]     = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AgendarCampos>()

  async function cargar() {
    const r = await api.get<Visita[]>('/familia/visitas')
    setVisitas(r.data)
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  async function agendar(data: AgendarCampos) {
    setError('')
    setGuardando(true)
    try {
      await api.post('/familia/visitas', data)
      reset()
      setMostrarForm(false)
      await cargar()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al agendar')
    } finally {
      setGuardando(false)
    }
  }

  const proximas  = visitas.filter(v => new Date(v.fecha_hora) >= new Date() && v.estado !== 'cancelada')
  const anteriores = visitas.filter(v => new Date(v.fecha_hora) < new Date() || v.estado === 'realizada')

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-mafe-oscuro">Visitas</h1>
        <button
          onClick={() => setMostrarForm(v => !v)}
          className="btn-primary text-sm"
        >
          {mostrarForm ? 'Cancelar' : '+ Agendar visita'}
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="card mb-5 border-2 border-mafe-claro">
          <h2 className="font-semibold text-gray-800 mb-4">Nueva visita</h2>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg p-3 mb-3">{error}</div>
          )}
          <form onSubmit={handleSubmit(agendar)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y hora *
              </label>
              <input
                type="datetime-local"
                {...register('fecha_hora', { required: 'Requerido' })}
                className="input-base"
                min={new Date().toISOString().slice(0, 16)}
              />
              {errors.fecha_hora && (
                <p className="text-xs text-red-500 mt-1">{errors.fecha_hora.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
              <textarea
                {...register('notas')}
                rows={2}
                className="input-base resize-none"
                placeholder="Mensaje para el equipo de cuidado..."
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="btn-primary flex-1">
                {guardando ? 'Agendando...' : 'Confirmar visita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando ? <Spinner /> : (
        <>
          {/* Próximas visitas */}
          {proximas.length > 0 && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-700 mb-3">Próximas visitas</h2>
              <div className="space-y-2">
                {proximas.map(v => {
                  const cfg = ESTADO_CFG[v.estado]
                  return (
                    <div key={v.id} className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-mafe-claro flex flex-col items-center justify-center shrink-0">
                        <p className="text-xs text-mafe-oscuro font-bold leading-none">
                          {new Date(v.fecha_hora).getDate()}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {new Date(v.fecha_hora).toLocaleString('es-CO', { month: 'short' })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm">{formatFechaHora(v.fecha_hora)}</p>
                        {v.notas && <p className="text-xs text-gray-500 truncate">{v.notas}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Historial */}
          {anteriores.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-700 mb-3">Historial</h2>
              <div className="space-y-2">
                {anteriores.map(v => {
                  const cfg = ESTADO_CFG[v.estado]
                  return (
                    <div key={v.id} className="card opacity-70 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">{formatFechaHora(v.fecha_hora)}</p>
                        {v.notas && <p className="text-xs text-gray-400">{v.notas}</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {visitas.length === 0 && !mostrarForm && (
            <div className="card text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">📅</p>
              <p className="font-medium">Sin visitas registradas</p>
              <p className="text-sm mt-1">Agenda tu próxima visita con el botón de arriba.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
