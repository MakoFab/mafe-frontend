'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface Visita {
  id: string
  fecha_hora: string
  duracion_min?: number
  estado: string
  notas?: string
}

const ESTADO_CFG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente:  { label: 'Pendiente',  bg: 'bg-amber-100',   text: 'text-amber-800',   dot: 'bg-amber-500'   },
  confirmada: { label: 'Confirmada', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  realizada:  { label: 'Realizada',  bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500'    },
  cancelada:  { label: 'Cancelada',  bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400'    },
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return {
    dia:   d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora:  d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    pasada: d < new Date(),
  }
}

function minLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function VisitasPage() {
  const [visitas, setVisitas]       = useState<Visita[]>([])
  const [cargando, setCargando]     = useState(true)
  const [modal, setModal]           = useState(false)
  const [fechaHora, setFechaHora]   = useState('')
  const [notas, setNotas]           = useState('')
  const [enviando, setEnviando]     = useState(false)
  const [error, setError]           = useState('')

  const minFecha = minLocal(new Date())

  useEffect(() => {
    api.get<Visita[]>('/familia/visitas')
      .then(r => setVisitas(r.data))
      .catch(() => setVisitas([]))
      .finally(() => setCargando(false))
  }, [])

  async function agendar(e: React.FormEvent) {
    e.preventDefault()
    if (!fechaHora) { setError('Selecciona fecha y hora'); return }
    setError('')
    setEnviando(true)
    try {
      const { data } = await api.post<Visita>('/familia/visitas', { fecha_hora: fechaHora, notas: notas || undefined })
      setVisitas(prev => [data, ...prev])
      setModal(false)
      setFechaHora('')
      setNotas('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo agendar la visita')
    } finally {
      setEnviando(false)
    }
  }

  const proximas  = visitas.filter(v => !formatFecha(v.fecha_hora).pasada || v.estado === 'pendiente')
  const pasadas   = visitas.filter(v =>  formatFecha(v.fecha_hora).pasada && v.estado !== 'pendiente')

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Visitas</h1>
            <p className="text-sm text-gray-500">Gestión de visitas familiares</p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-mafe text-white text-sm font-semibold rounded-xl hover:bg-mafe-hover transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agendar
          </button>
        </div>

        {cargando && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && visitas.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📅</p>
            <p className="text-sm">No hay visitas registradas</p>
            <button
              onClick={() => setModal(true)}
              className="mt-4 text-mafe text-sm font-medium hover:underline"
            >
              Agendar primera visita →
            </button>
          </div>
        )}

        {/* Próximas */}
        {!cargando && proximas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Próximas</p>
            {proximas.map(v => <TarjetaVisita key={v.id} v={v} />)}
          </div>
        )}

        {/* Historial */}
        {!cargando && pasadas.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Historial</p>
            {pasadas.map(v => <TarjetaVisita key={v.id} v={v} />)}
          </div>
        )}
      </div>

      {/* Modal agendar */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setModal(false)}>
          <div
            className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-w-lg mx-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Agendar visita</h2>
              <button
                onClick={() => setModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={agendar} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Fecha y hora <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={fechaHora}
                  onChange={e => setFechaHora(e.target.value)}
                  min={minFecha}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notas adicionales
                </label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Ej: Visitaré con mis hijos..."
                  className="input-base resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  ℹ Las visitas quedan en estado <strong>pendiente</strong> hasta ser confirmadas por la administración.
                  Horario permitido: lunes a domingo 9:00 am – 7:00 pm.
                </p>
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-3 bg-mafe text-white font-semibold rounded-xl hover:bg-mafe-hover transition-colors disabled:opacity-60"
              >
                {enviando ? 'Agendando...' : 'Confirmar solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function TarjetaVisita({ v }: { v: Visita }) {
  const { dia, hora, pasada } = formatFecha(v.fecha_hora)
  const cfg = ESTADO_CFG[v.estado] ?? ESTADO_CFG.pendiente

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${pasada ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Calendar icon */}
        <div className="shrink-0 w-12 h-12 bg-mafe/10 rounded-xl flex flex-col items-center justify-center">
          <span className="text-mafe text-xs font-bold leading-none">
            {new Date(v.fecha_hora).toLocaleDateString('es-CO', { month: 'short' }).toUpperCase()}
          </span>
          <span className="text-mafe text-lg font-black leading-none">
            {new Date(v.fecha_hora).getDate()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-gray-800 capitalize truncate">{dia}</p>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {hora}{v.duracion_min ? ` · ${v.duracion_min} min` : ''}
          </p>
          {v.notas && (
            <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2 py-1 line-clamp-2">
              {v.notas}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
