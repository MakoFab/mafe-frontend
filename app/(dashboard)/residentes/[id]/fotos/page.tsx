'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { formatFechaHora } from '@/lib/utils'

// ── tipos ────────────────────────────────────────────────────
interface Foto {
  id: string
  url_archivo: string
  thumbnail_url?: string
  descripcion?: string
  actividad?: string
  subido_en: string
  subido_por_nombre?: string
  visible_familia: boolean
}

// ── modal nueva foto ─────────────────────────────────────────
interface ModalSubirProps {
  residenteId: string
  onClose: () => void
  onSubida: () => void
}

function ModalSubir({ residenteId, onClose, onSubida }: ModalSubirProps) {
  const [form, setForm] = useState({
    url_archivo:    '',
    descripcion:    '',
    actividad:      '',
    visible_familia: true,
  })
  const [preview,  setPreview]  = useState('')
  const [guardando,setGuardando]= useState(false)
  const [error,    setError]    = useState('')

  const ACTIVIDADES = [
    'Taller de tejido', 'Taller de pintura', 'Taller de escritura',
    'Almuerzo del día', 'Desayuno del día',
    'Sesión de fisioterapia', 'Terapia ocupacional', 'Fonoaudiología',
    'Estimulación cognitiva', 'Musicoterapia', 'Aeróbicos en silla',
    'Paseo jardín', 'Caminata asistida',
    'Celebración cumpleaños', 'Celebración especial',
    'Visita familiar', 'Tarde recreativa', 'Juegos de mesa',
    'Control médico', 'Revisión médica', 'Otro',
  ]

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url_archivo.trim()) { setError('Ingresa la URL de la imagen'); return }
    setGuardando(true); setError('')
    try {
      await api.post(`/residentes/${residenteId}/fotos`, {
        url_archivo:    form.url_archivo.trim(),
        thumbnail_url:  form.url_archivo.trim(),
        descripcion:    form.descripcion.trim() || undefined,
        actividad:      form.actividad.trim()   || undefined,
        visible_familia: form.visible_familia,
      })
      onSubida()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la foto')
    } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
           onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <p className="font-bold text-gray-900">Subir nueva foto</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={guardar} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</div>}

          {/* URL */}
          <div>
            <label className="label-base">URL de la imagen <span className="text-red-500">*</span></label>
            <input type="url" className="input-base" placeholder="https://..."
              value={form.url_archivo}
              onChange={e => { set('url_archivo', e.target.value); setPreview(e.target.value) }} />
            <p className="text-xs text-gray-400 mt-1">Puede usar https://picsum.photos/800/600 para imágenes de prueba</p>
          </div>

          {/* Vista previa */}
          {preview && (
            <div className="rounded-xl overflow-hidden h-48 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Vista previa" className="w-full h-full object-cover"
                onError={() => setPreview('')} />
            </div>
          )}

          {/* Actividad */}
          <div>
            <label className="label-base">Actividad</label>
            <select className="input-base" value={form.actividad} onChange={e => set('actividad', e.target.value)}>
              <option value="">Seleccionar actividad...</option>
              {ACTIVIDADES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="label-base">Descripción</label>
            <textarea className="input-base resize-none" rows={3}
              placeholder="Descripción de lo que ocurre en la foto..."
              value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>

          {/* Visible familia */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-800">Visible para la familia</p>
              <p className="text-xs text-gray-500 mt-0.5">Esta foto aparecerá en el portal familiar</p>
            </div>
            <button type="button"
              onClick={() => set('visible_familia', !form.visible_familia)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.visible_familia ? 'bg-mafe' : 'bg-gray-300'
              }`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                form.visible_familia ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? 'Subiendo...' : 'Guardar foto'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── lightbox ─────────────────────────────────────────────────
function Lightbox({ foto, onClose, onAnterior, onSiguiente, hayAnterior, haySiguiente }: {
  foto: Foto
  onClose: () => void
  onAnterior: () => void
  onSiguiente: () => void
  hayAnterior: boolean
  haySiguiente: boolean
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')    onClose()
      if (e.key === 'ArrowLeft'  && hayAnterior) onAnterior()
      if (e.key === 'ArrowRight' && haySiguiente) onSiguiente()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hayAnterior, haySiguiente])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Barra top */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
        <div className="text-white min-w-0">
          {foto.actividad && <p className="font-semibold text-sm">{foto.actividad}</p>}
          <p className="text-white/60 text-xs mt-0.5">
            {formatFechaHora(foto.subido_en)}
            {foto.subido_por_nombre && ` · ${foto.subido_por_nombre}`}
            {foto.visible_familia && (
              <span className="ml-2 bg-mafe/20 text-mafe-claro px-1.5 py-0.5 rounded-full text-[10px] font-semibold">👨‍👩‍👧 Familia</span>
            )}
          </p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white p-2 shrink-0">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Imagen */}
      <div className="flex-1 flex items-center justify-center px-12 relative" onClick={e => e.stopPropagation()}>
        {hayAnterior && (
          <button onClick={onAnterior}
            className="absolute left-2 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url_archivo} alt={foto.descripcion || 'Foto'} className="max-w-full max-h-full object-contain rounded-xl" />
        {haySiguiente && (
          <button onClick={onSiguiente}
            className="absolute right-2 text-white/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Descripción */}
      {foto.descripcion && (
        <div className="shrink-0 px-5 pb-6 pt-3" onClick={e => e.stopPropagation()}>
          <p className="text-white/80 text-sm text-center max-w-xl mx-auto">{foto.descripcion}</p>
        </div>
      )}
    </div>
  )
}

// ── página principal ─────────────────────────────────────────
export default function FotosResidentePage() {
  const { id } = useParams<{ id: string }>()

  const [fotos,    setFotos]    = useState<Foto[]>([])
  const [cargando, setCargando] = useState(true)
  const [modal,    setModal]    = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)

  // Filtros
  const [filtroActividad, setFiltroActividad] = useState('')
  const [filtroDesde,     setFiltroDesde]     = useState('')
  const [filtroHasta,     setFiltroHasta]     = useState('')
  const [filtroFamilia,   setFiltroFamilia]   = useState(false)

  const cargar = useCallback(() => {
    setCargando(true)
    const params = new URLSearchParams()
    if (filtroActividad) params.set('actividad', filtroActividad)
    if (filtroDesde)     params.set('desde', filtroDesde)
    if (filtroHasta)     params.set('hasta', filtroHasta)
    if (filtroFamilia)   params.set('visible_familia', 'true')

    api.get<Foto[]>(`/residentes/${id}/fotos?${params.toString()}`)
      .then(r => setFotos(r.data))
      .finally(() => setCargando(false))
  }, [id, filtroActividad, filtroDesde, filtroHasta, filtroFamilia])

  useEffect(() => { cargar() }, [cargar])

  // Actividades únicas para el filtro
  const actividades = Array.from(new Set(fotos.map(f => f.actividad).filter(Boolean) as string[])).sort()

  const fotosVisiF = fotos.filter(f => f.visible_familia).length

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Galería de fotos</h2>
            <p className="text-sm text-gray-500">
              {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
              {fotosVisiF > 0 && ` · ${fotosVisiF} visibles para la familia`}
            </p>
          </div>
          <button onClick={() => setModal(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Subir foto
          </button>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label-base">Actividad</label>
              <select className="input-base" value={filtroActividad} onChange={e => setFiltroActividad(e.target.value)}>
                <option value="">Todas las actividades</option>
                {actividades.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="label-base">Desde</label>
              <input type="date" className="input-base" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} />
            </div>
            <div>
              <label className="label-base">Hasta</label>
              <input type="date" className="input-base" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-3 w-full">
                <button type="button"
                  onClick={() => setFiltroFamilia(!filtroFamilia)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${filtroFamilia ? 'bg-mafe' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${filtroFamilia ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm text-gray-700 font-medium">Solo familia</span>
              </div>
            </div>
          </div>
          {(filtroActividad || filtroDesde || filtroHasta || filtroFamilia) && (
            <button
              onClick={() => { setFiltroActividad(''); setFiltroDesde(''); setFiltroHasta(''); setFiltroFamilia(false) }}
              className="text-xs text-mafe hover:underline mt-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Grid fotos */}
        {cargando ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
          </div>
        ) : fotos.length === 0 ? (
          <div className="card text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="font-medium text-gray-600">Sin fotos</p>
            <p className="text-sm mt-1">
              {(filtroActividad || filtroDesde || filtroHasta || filtroFamilia)
                ? 'No hay fotos con estos filtros.'
                : 'Las fotos del residente aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {fotos.map((foto, idx) => (
              <button
                key={foto.id}
                onClick={() => setLightbox(idx)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:ring-2 hover:ring-mafe ring-offset-2 transition-all focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.thumbnail_url ?? foto.url_archivo}
                  alt={foto.descripcion ?? 'Foto'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Overlay inferior */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  {foto.actividad && (
                    <p className="text-white text-xs font-semibold truncate">{foto.actividad}</p>
                  )}
                  <p className="text-white/70 text-[10px]">
                    {new Date(foto.subido_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </p>
                </div>

                {/* Badge visible familia */}
                {foto.visible_familia && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-mafe rounded-full flex items-center justify-center shadow-sm" title="Visible para la familia">
                    <span className="text-white text-[10px]">👨‍👩‍👧</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal subir foto */}
      {modal && (
        <ModalSubir
          residenteId={id}
          onClose={() => setModal(false)}
          onSubida={cargar}
        />
      )}

      {/* Lightbox */}
      {lightbox !== null && fotos[lightbox] && (
        <Lightbox
          foto={fotos[lightbox]}
          onClose={() => setLightbox(null)}
          onAnterior={() => setLightbox(i => (i ?? 0) - 1)}
          onSiguiente={() => setLightbox(i => (i ?? 0) + 1)}
          hayAnterior={lightbox > 0}
          haySiguiente={lightbox < fotos.length - 1}
        />
      )}
    </>
  )
}
