'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { formatFechaHora } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'

interface Foto {
  url_archivo: string
  thumbnail_url?: string
  descripcion?: string
  actividad?: string
  subido_en: string
  subido_por: string
}

export default function FotosFamiliaPage() {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [cargando, setCargando] = useState(true)
  const [ampliada, setAmpliada] = useState<Foto | null>(null)

  useEffect(() => {
    api.get<Foto[]>('/familia/fotos')
      .then(r => setFotos(r.data))
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return <Spinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-mafe-oscuro">Galería de fotos</h1>
        <span className="text-sm text-gray-400">{fotos.length} fotos</span>
      </div>

      {fotos.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📷</p>
          <p className="font-medium">Sin fotos aún</p>
          <p className="text-sm mt-1">El equipo publicará fotos de las actividades aquí.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {fotos.map((foto, i) => (
            <button
              key={i}
              onClick={() => setAmpliada(foto)}
              className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
            >
              <img
                src={foto.thumbnail_url ?? foto.url_archivo}
                alt={foto.descripcion ?? ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {foto.actividad && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{foto.actividad}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {ampliada && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setAmpliada(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={ampliada.url_archivo}
              alt={ampliada.descripcion ?? ''}
              className="w-full object-contain max-h-72"
            />
            <div className="p-4">
              {ampliada.actividad  && <p className="font-semibold text-gray-800">{ampliada.actividad}</p>}
              {ampliada.descripcion && <p className="text-sm text-gray-500 mt-0.5">{ampliada.descripcion}</p>}
              <p className="text-xs text-gray-400 mt-2">
                {formatFechaHora(ampliada.subido_en)} · {ampliada.subido_por}
              </p>
              <button
                onClick={() => setAmpliada(null)}
                className="mt-3 btn-secondary w-full"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
