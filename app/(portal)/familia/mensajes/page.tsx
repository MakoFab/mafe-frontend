'use client'
import { useEffect, useRef, useState } from 'react'
import api from '@/lib/api'
import { obtenerUsuario } from '@/lib/auth'
import { formatFechaHora, etiquetaRol } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Mensaje {
  id: string
  contenido: string
  enviado_en: string
  remitente: string
  rol_remitente: string
  es_mio: boolean
}

export default function MensajesFamiliaPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const usuario = obtenerUsuario()

  async function cargar() {
    const r = await api.get<Mensaje[]>('/familia/mensajes')
    setMensajes(r.data)
  }

  useEffect(() => {
    cargar().finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviando) return
    setEnviando(true)
    try {
      await api.post('/familia/mensajes', { contenido: texto.trim() })
      setTexto('')
      await cargar()
    } finally {
      setEnviando(false)
    }
  }

  if (cargando) return <Spinner />

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <h1 className="text-xl font-bold text-mafe-oscuro mb-4">Mensajes</h1>

      {/* Feed de mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {mensajes.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-3xl mb-2">💬</p>
            <p>Inicia una conversación con el equipo de cuidado.</p>
          </div>
        )}

        {mensajes.map(m => (
          <div
            key={m.id}
            className={`flex ${m.es_mio ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${m.es_mio ? 'items-end' : 'items-start'} flex flex-col`}>
              {!m.es_mio && (
                <p className="text-xs text-gray-500 mb-1 ml-1">
                  {m.remitente} · {etiquetaRol(m.rol_remitente)}
                </p>
              )}
              <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                m.es_mio
                  ? 'bg-mafe text-white rounded-br-sm'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
              }`}>
                {m.contenido}
              </div>
              <p className="text-xs text-gray-400 mt-1 mx-1">
                {formatFechaHora(m.enviado_en)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={enviar} className="flex gap-2 pt-3 border-t border-gray-200 bg-mafe-claro sticky bottom-0 pb-1">
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          className="input-base flex-1"
          placeholder="Escribe un mensaje al equipo..."
          disabled={enviando}
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="btn-primary px-5 shrink-0"
        >
          {enviando ? '...' : '➤'}
        </button>
      </form>
    </div>
  )
}
