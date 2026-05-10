'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Residente } from '@/types'
import { formatFecha, calcularEdad } from '@/lib/utils'

// ── tipos ────────────────────────────────────────────────────
interface Familiar {
  id: string
  parentesco: string
  es_contacto_ppal: boolean
  portal_activo: boolean
  nombre: string
  apellido: string
  email: string
  telefono?: string
}

// ── constantes visuales ───────────────────────────────────────
const DEPENDENCIA_CFG: Record<string, { label: string; color: string }> = {
  independiente: { label: 'Independiente', color: 'bg-emerald-100 text-emerald-800' },
  asistido:      { label: 'Asistido',      color: 'bg-amber-100  text-amber-800'  },
  dependiente:   { label: 'Dependiente',   color: 'bg-orange-100 text-orange-800' },
  total:         { label: 'Total',         color: 'bg-red-100    text-red-800'    },
}

const GENERO_LABEL: Record<string, string> = {
  masculino: 'Masculino', femenino: 'Femenino', otro: 'Otro',
}

// ── subcomponentes ───────────────────────────────────────────
function Fila({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <dt className="w-40 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-800 flex-1">{value}</dd>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-1">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{titulo}</h3>
      <dl>{children}</dl>
    </div>
  )
}

// ── modal foto perfil ────────────────────────────────────────
function ModalFotoPerfil({
  residenteId, fotoActual, onClose, onGuardada,
}: { residenteId: string; fotoActual?: string; onClose: () => void; onGuardada: (url: string) => void }) {
  const [url, setUrl]         = useState(fotoActual ?? '')
  const [guardando, setG]     = useState(false)
  const [error, setError]     = useState('')

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) { setError('Ingresa una URL de imagen'); return }
    setG(true)
    try {
      await api.put(`/residentes/${residenteId}`, { foto_url: url.trim() })
      onGuardada(url.trim())
      onClose()
    } catch { setError('No se pudo actualizar la foto') }
    finally   { setG(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900">Foto de perfil</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}
        <form onSubmit={guardar} className="space-y-3">
          <div>
            <label className="label-base">URL de la imagen</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              className="input-base" placeholder="https://..." />
          </div>
          {url && (
            <div className="rounded-xl overflow-hidden h-40 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Vista previa" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = '' }} />
            </div>
          )}
          <button type="submit" disabled={guardando} className="btn-primary w-full">
            {guardando ? 'Guardando...' : 'Guardar foto'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── página principal ─────────────────────────────────────────
export default function ResidentePerfilPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [r,           setR]           = useState<Residente | null>(null)
  const [familiares,  setFamiliares]  = useState<Familiar[]>([])
  const [fotoModal,   setFotoModal]   = useState(false)
  const [cargando,    setCargando]    = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Residente>(`/residentes/${id}`),
      api.get<Familiar[]>(`/residentes/${id}/familiares`),
    ])
      .then(([res, fam]) => { setR(res.data); setFamiliares(fam.data) })
      .finally(() => setCargando(false))
  }, [id])

  if (cargando) return (
    <div className="flex justify-center py-16">
      <div className="w-6 h-6 border-2 border-mafe border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!r) return <div className="card p-8 text-center text-gray-400">Residente no encontrado</div>

  const edad = r.edad ?? calcularEdad(r.fecha_nacimiento)
  const iniciales = `${r.nombre[0]}${r.apellido[0]}`.toUpperCase()
  const depCfg = r.nivel_dependencia ? DEPENDENCIA_CFG[r.nivel_dependencia] : null

  return (
    <>
      <div className="max-w-4xl space-y-4">

        {/* ── Tarjeta superior: foto + identidad ── */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-6">

            {/* Foto perfil */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="relative group">
                {r.foto_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={r.foto_url} alt={`${r.nombre} ${r.apellido}`}
                    className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-100 shadow-sm" />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-mafe-oscuro to-mafe flex items-center justify-center text-white text-3xl font-black shadow-sm">
                    {iniciales}
                  </div>
                )}
                <button
                  onClick={() => setFotoModal(true)}
                  className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-white text-xs font-semibold">📷 Cambiar</span>
                </button>
              </div>
              <button onClick={() => setFotoModal(true)}
                className="text-xs text-mafe hover:underline font-medium">
                {r.foto_url ? 'Cambiar foto' : 'Añadir foto'}
              </button>
            </div>

            {/* Datos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start gap-3 mb-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{r.nombre} {r.apellido}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {edad} años &nbsp;·&nbsp;
                    {r.tipo_sangre && <span className="font-semibold text-red-600">{r.tipo_sangre}&nbsp;·&nbsp;</span>}
                    Hab. <span className="font-semibold">{r.habitacion ?? '—'}</span>
                  </p>
                </div>
                {depCfg && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${depCfg.color}`}>
                    {depCfg.label}
                  </span>
                )}
              </div>

              {/* Mini grid de datos clave */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5 text-sm">
                {r.documento_tipo && r.documento_numero && (
                  <span className="text-gray-500">{r.documento_tipo} <span className="text-gray-800 font-medium">{r.documento_numero}</span></span>
                )}
                {r.genero && (
                  <span className="text-gray-500">{GENERO_LABEL[r.genero] ?? r.genero}</span>
                )}
                {r.eps && (
                  <span className="text-gray-500">EPS: <span className="text-gray-800 font-medium">{r.eps}</span></span>
                )}
                {r.numero_afiliacion && (
                  <span className="text-gray-500">N.° afil: <span className="text-gray-800 font-medium">{r.numero_afiliacion}</span></span>
                )}
                <span className="text-gray-500">Ingreso: <span className="text-gray-800 font-medium">{formatFecha(r.fecha_ingreso)}</span></span>
                {r.medico_tratante && (
                  <span className="text-gray-500 col-span-2">Dr.: <span className="text-gray-800 font-medium">{r.medico_tratante}</span></span>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="shrink-0 self-start">
              <button
                onClick={() => router.push(`/residentes/${id}/editar`)}
                className="btn-secondary text-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </button>
            </div>
          </div>
        </div>

        {/* ── Diagnósticos ── */}
        {r.diagnosticos && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg">🏥</span>
              <h3 className="text-sm font-bold text-gray-800">Diagnósticos principales</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.diagnosticos.split(/[,\n]+/).map(d => d.trim()).filter(Boolean).map((dx, i) => (
                <span key={i} className="px-3 py-1 bg-blue-50 text-blue-800 text-sm rounded-full border border-blue-100">
                  {dx}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Alergias ── */}
        {r.alergias && (
          <div className="card p-5 border-l-4 border-l-red-400">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">⚠️</span>
              <h3 className="text-sm font-bold text-red-700">Alergias conocidas</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.alergias.split(/[,\n]+/).map(a => a.trim()).filter(Boolean).map((al, i) => (
                <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full border border-red-200 font-medium">
                  {al}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Datos en 2 columnas ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Datos personales */}
          <Seccion titulo="Datos personales">
            <Fila label="Fecha nacimiento" value={formatFecha(r.fecha_nacimiento)} />
            <Fila label="Edad"             value={`${edad} años`} />
            <Fila label="Género"           value={r.genero ? (GENERO_LABEL[r.genero] ?? r.genero) : null} />
            <Fila label="Documento"        value={r.documento_tipo && r.documento_numero ? `${r.documento_tipo} ${r.documento_numero}` : null} />
            <Fila label="Tipo de sangre"   value={r.tipo_sangre} />
          </Seccion>

          {/* Datos de ingreso */}
          <Seccion titulo="Datos de ingreso">
            <Fila label="Habitación"       value={r.habitacion} />
            <Fila label="Fecha de ingreso" value={formatFecha(r.fecha_ingreso)} />
            <Fila label="Nivel dependencia" value={depCfg?.label} />
            <Fila label="Médico tratante"  value={r.medico_tratante} />
            <Fila label="Estado"           value={r.estado} />
          </Seccion>

          {/* Seguridad social */}
          <Seccion titulo="Seguridad social">
            <Fila label="EPS"              value={r.eps} />
            <Fila label="N.° afiliación"   value={r.numero_afiliacion} />
          </Seccion>

          {/* Dieta especial */}
          {r.dieta_especial && (
            <div className="card p-5 border-l-4 border-l-amber-400">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🍽️</span>
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider">Dieta especial</h3>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{r.dieta_especial}</p>
            </div>
          )}
        </div>

        {/* ── Observaciones clínicas ── */}
        {r.observaciones && (
          <Seccion titulo="Observaciones clínicas">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pt-1">{r.observaciones}</p>
          </Seccion>
        )}

        {/* ── Familiares y contactos ── */}
        <div className="card p-5">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Familiares y contactos registrados
          </h3>
          {familiares.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Sin familiares registrados</p>
          ) : (
            <div className="space-y-3">
              {familiares.map(f => (
                <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-mafe/15 flex items-center justify-center text-mafe font-bold text-sm shrink-0">
                    {f.nombre[0]}{f.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{f.nombre} {f.apellido}</p>
                      <span className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 capitalize">
                        {f.parentesco}
                      </span>
                      {f.es_contacto_ppal && (
                        <span className="px-2 py-0.5 bg-mafe/10 text-mafe rounded-full text-xs font-semibold">
                          Contacto principal
                        </span>
                      )}
                      {f.portal_activo && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs">
                          Portal activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{f.email}</p>
                    {f.telefono && <p className="text-xs text-gray-500">{f.telefono}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal foto */}
      {fotoModal && (
        <ModalFotoPerfil
          residenteId={id}
          fotoActual={r.foto_url}
          onClose={() => setFotoModal(false)}
          onGuardada={url => setR(prev => prev ? { ...prev, foto_url: url } : prev)}
        />
      )}
    </>
  )
}
