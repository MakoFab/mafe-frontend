'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import api from '@/lib/api'

interface Foto {
  url_archivo: string
  thumbnail_url?: string
  descripcion?: string
  actividad?: string
  subido_en: string
  subido_por: string
}

function formatFecha(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

function groupByDay(fotos: Foto[]) {
  const groups: Record<string, Foto[]> = {}
  for (const f of fotos) {
    const day = f.subido_en.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(f)
  }
  return groups
}

export default function FotosPage() {
  const [fotos, setFotos]         = useState<Foto[]>([])
  const [cargando, setCargando]   = useState(true)
  const [abierta, setAbierta]     = useState<Foto | null>(null)

  useEffect(() => {
    api.get<Foto[]>('/familia/fotos')
      .then(r => setFotos(r.data))
      .catch(() => setFotos([]))
      .finally(() => setCargando(false))
  }, [])

  const grupos   = groupByDay(fotos)
  const dia_keys = Object.keys(grupos).sort().reverse()

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-bold text-gray-900">Fotos</h1>
          <p className="text-sm text-gray-500">{fotos.length} foto{fotos.length !== 1 ? 's' : ''} compartidas</p>
        </div>

        {cargando && (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!cargando && fotos.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-sm">Aún no hay fotos compartidas</p>
          </div>
        )}

        {!cargando && dia_keys.map(dia => (
          <div key={dia}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {formatFecha(dia + 'T12:00:00')}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {grupos[dia].map((f, i) => (
                <button
                  key={i}
                  onClick={() => setAbierta(f)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-mafe"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.thumbnail_url || f.url_archivo}
                    alt={f.descripcion || 'Foto del residente'}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  {f.actividad && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <p className="text-white text-[10px] leading-tight truncate">{f.actividad}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {abierta && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setAbierta(null)}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <div className="text-white">
              <p className="text-sm font-medium">{abierta.actividad || 'Foto'}</p>
              <p className="text-xs text-white/60">{formatFecha(abierta.subido_en)}</p>
            </div>
            <button
              onClick={() => setAbierta(null)}
              className="text-white/60 hover:text-white p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center px-4"
            onClick={e => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={abierta.url_archivo}
              alt={abierta.descripcion || 'Foto'}
              className="max-w-full max-h-full object-contain rounded-xl"
            />
          </div>

          <div className="px-4 pb-6 pt-3 shrink-0" onClick={e => e.stopPropagation()}>
            {abierta.descripcion && (
              <p className="text-white text-sm mb-1">{abierta.descripcion}</p>
            )}
            <p className="text-white/50 text-xs">Subida por {abierta.subido_por}</p>
          </div>
        </div>
      )}
    </>
  )
}
