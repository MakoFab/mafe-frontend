'use client'
import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'

interface Mensaje {
  id: string
  contenido: string
  enviado_en: string
  leido: boolean
  remitente: string
  rol_remitente: string
  es_mio: boolean
}

const ROL_LABEL: Record<string, string> = {
  familiar:    'Familiar',
  cuidador:    'Cuidador',
  medico:      'Médico',
  enfermera:   'Enfermera',
  admin:       'Administración',
  supervisor:  'Supervisor',
}

function formatHora(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function formatDia(iso: string) {
  const d = new Date(iso)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
  if (d.toDateString() === hoy.toDateString()) return 'Hoy'
  if (d.toDateString() === ayer.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}

export default function MensajesPage() {
  const [mensajes, setMensajes]   = useState<Mensaje[]>([])
  const [cargando, setCargando]   = useState(true)
  const [texto, setTexto]         = useState('')
  const [enviando, setEnviando]   = useState(false)
  const endRef                    = useRef<HTMLDivElement>(null)
  const textRef                   = useRef<HTMLTextAreaElement>(null)

  function scrollAbajo() {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    api.get<Mensaje[]>('/familia/mensajes')
      .then(r => setMensajes(r.data))
      .catch(() => setMensajes([]))
      .finally(() => { setCargando(false); setTimeout(scrollAbajo, 100) })
  }, [])

  useEffect(() => {
    if (!cargando) scrollAbajo()
  }, [mensajes, cargando])

  async function enviar() {
    const contenido = texto.trim()
    if (!contenido || enviando) return
    setEnviando(true)
    try {
      const { data } = await api.post<{ id: string; contenido: string; enviado_en: string }>(
        '/familia/mensajes',
        { contenido },
      )
      setMensajes(prev => [...prev, {
        id: data.id,
        contenido: data.contenido,
        enviado_en: data.enviado_en,
        leido: false,
        remitente: 'Tú',
        rol_remitente: 'familiar',
        es_mio: true,
      }])
      setTexto('')
      textRef.current?.focus()
    } catch {
      // silently fail — user can retry
    } finally {
      setEnviando(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  // Group messages by day for separators
  const rendered: React.ReactNode[] = []
  let lastDay = ''

  for (const m of mensajes) {
    const dia = m.enviado_en.slice(0, 10)
    if (dia !== lastDay) {
      lastDay = dia
      rendered.push(
        <div key={`sep-${dia}`} className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">{formatDia(m.enviado_en)}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
      )
    }

    rendered.push(
      <div key={m.id} className={`flex ${m.es_mio ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[78%] ${m.es_mio ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
          {!m.es_mio && (
            <p className="text-[10px] text-gray-400 px-1">
              {m.remitente} · {ROL_LABEL[m.rol_remitente] ?? m.rol_remitente}
            </p>
          )}
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            m.es_mio
              ? 'bg-mafe text-white rounded-br-sm'
              : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
          }`}>
            {m.contenido}
          </div>
          <p className={`text-[10px] text-gray-400 px-1 ${m.es_mio ? 'text-right' : ''}`}>
            {formatHora(m.enviado_en)}
            {m.es_mio && (
              <span className="ml-1">{m.leido ? '✓✓' : '✓'}</span>
            )}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
      {/* Header */}
      <div className="shrink-0 mb-3">
        <h1 className="text-lg font-bold text-gray-900">Mensajes</h1>
        <p className="text-sm text-gray-500">Comunicación con el equipo de cuidado</p>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-1 pb-2">
        {cargando && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && mensajes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-12">
            <p className="text-4xl mb-2">💬</p>
            <p className="text-sm text-center">
              Aún no hay mensajes.<br />
              ¡Escribe al equipo de cuidado!
            </p>
          </div>
        )}

        {!cargando && rendered}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-3 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-sm px-3 py-2">
          <textarea
            ref={textRef}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            rows={1}
            className="flex-1 resize-none text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent max-h-24"
            style={{ lineHeight: '1.5' }}
          />
          <button
            onClick={enviar}
            disabled={!texto.trim() || enviando}
            className="shrink-0 w-9 h-9 bg-mafe rounded-xl flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            {enviando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}
