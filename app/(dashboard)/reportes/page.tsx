'use client'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface ResidenteOpt {
  id: string
  nombre: string
  apellido: string
  habitacion?: string
}

type PeriodoPreset = '7' | '30' | '90' | 'custom'

interface HistorialItem {
  residente: string
  periodo: string
  generado_en: string
  filename: string
}

const HISTORIAL_KEY = 'mafe_reportes_historial'
const MAX_HISTORIAL = 10

function guardarHistorial(item: HistorialItem) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY)
    const prev: HistorialItem[] = raw ? JSON.parse(raw) : []
    const updated = [item, ...prev].slice(0, MAX_HISTORIAL)
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(updated))
  } catch { /* ignore */ }
}

function cargarHistorial(): HistorialItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORIAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

function fmtFechaHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

export default function ReportesPage() {
  const [residentes, setResidentes] = useState<ResidenteOpt[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [preset, setPreset] = useState<PeriodoPreset>('30')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')
  const [loadingResidente, setLoadingResidente] = useState(false)
  const [loadingTurno, setLoadingTurno] = useState(false)
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<ResidenteOpt[]>('/residentes?estado=activo')
      .then(r => setResidentes(r.data))
      .catch(() => { /* silent */ })
    setHistorial(cargarHistorial())

    // Default custom dates
    const hoy = new Date()
    setCustomHasta(toISO(hoy))
    setCustomDesde(toISO(addDays(hoy, -30)))
  }, [])

  function getPeriodo(): { desde: string; hasta: string; label: string } {
    const hoy = new Date()
    if (preset === 'custom') {
      return { desde: customDesde, hasta: customHasta, label: `${customDesde} – ${customHasta}` }
    }
    const dias = Number(preset)
    const desde = addDays(hoy, -dias)
    const labels: Record<string, string> = { '7': 'Última semana', '30': 'Último mes', '90': 'Últimos 3 meses' }
    return { desde: toISO(desde), hasta: toISO(hoy), label: labels[preset] ?? `Últimos ${dias} días` }
  }

  async function handleGenerarTurno() {
    setError(null)
    setLoadingTurno(true)
    try {
      const { generarReporteTurno } = await import('@/lib/pdf/reporteTurno')
      await generarReporteTurno()
    } catch (err: any) {
      setError(err?.message ?? 'Error generando reporte de turno')
    } finally {
      setLoadingTurno(false)
    }
  }

  async function handleGenerarResidente() {
    if (!selectedId) { setError('Seleccione un residente'); return }
    setError(null)
    setLoadingResidente(true)
    try {
      const { generarReporteResidente } = await import('@/lib/pdf/reporteResidente')
      const periodo = getPeriodo()
      await generarReporteResidente(selectedId, periodo)

      // Save to historial
      const res = residentes.find(r => r.id === selectedId)
      const nombre = res ? `${res.nombre} ${res.apellido}` : selectedId
      const apellidoClean = (res?.apellido ?? selectedId).replace(/\s+/g, '_')
      const item: HistorialItem = {
        residente: nombre,
        periodo: periodo.label,
        generado_en: new Date().toISOString(),
        filename: `Informe_${apellidoClean}_${periodo.desde}_${periodo.hasta}.pdf`,
      }
      guardarHistorial(item)
      setHistorial(cargarHistorial())
    } catch (err: any) {
      setError(err?.message ?? 'Error generando informe del residente')
    } finally {
      setLoadingResidente(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes e Informes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genere informes clínicos en PDF para residentes o resúmenes de turno del personal.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Reporte de Turno */}
        <div className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-mafe-claro flex items-center justify-center shrink-0">
              <span className="text-mafe-oscuro font-bold text-lg">T</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reporte de Turno Diario</h2>
              <p className="text-sm text-gray-500">
                Resumen del turno actual con estado de todos los residentes activos, medicamentos y registros del día.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Incluye:</span> Estado de cada residente, registros de turno, adherencia de medicamentos e incidentes del día.</p>
            <p><span className="font-medium">Formato:</span> A4 apaisado (landscape) — ideal para impresión.</p>
          </div>

          <button
            onClick={handleGenerarTurno}
            disabled={loadingTurno}
            className="btn-primary w-full"
          >
            {loadingTurno ? 'Generando PDF...' : 'Generar PDF de Turno'}
          </button>
        </div>

        {/* Section 2: Informe por Residente */}
        <div className="card">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-mafe-claro flex items-center justify-center shrink-0">
              <span className="text-mafe-oscuro font-bold text-lg">R</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Informe por Residente</h2>
              <p className="text-sm text-gray-500">
                Informe clínico completo de un residente para un período determinado.
              </p>
            </div>
          </div>

          {/* Residente selector */}
          <div className="mb-4">
            <label className="label-base">Residente</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="input-base"
            >
              <option value="">— Seleccione un residente —</option>
              {residentes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.nombre} {r.apellido}{r.habitacion ? ` · Hab. ${r.habitacion}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Period selector */}
          <div className="mb-4">
            <label className="label-base">Período del informe</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {([
                { value: '7',      label: 'Última semana' },
                { value: '30',     label: 'Último mes' },
                { value: '90',     label: 'Últimos 3 meses' },
                { value: 'custom', label: 'Personalizado' },
              ] as { value: PeriodoPreset; label: string }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPreset(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    preset === opt.value
                      ? 'bg-mafe-oscuro text-white border-mafe-oscuro'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-mafe-oscuro hover:text-mafe-oscuro'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="label-base">Desde</label>
                  <input
                    type="date"
                    value={customDesde}
                    onChange={e => setCustomDesde(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base">Hasta</label>
                  <input
                    type="date"
                    value={customHasta}
                    onChange={e => setCustomHasta(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleGenerarResidente}
            disabled={loadingResidente || !selectedId}
            className="btn-primary w-full"
          >
            {loadingResidente ? 'Generando informe...' : 'Generar Informe PDF'}
          </button>
        </div>
      </div>

      {/* Historial */}
      {historial.length > 0 && (
        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Informes generados recientemente</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 text-gray-500 font-medium">Residente</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Período</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Generado</th>
                  <th className="text-left pb-2 text-gray-500 font-medium">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historial.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-900">{item.residente}</td>
                    <td className="py-2 text-gray-600">{item.periodo}</td>
                    <td className="py-2 text-gray-500">{fmtFechaHora(item.generado_en)}</td>
                    <td className="py-2 text-gray-400 text-xs font-mono">{item.filename}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guide card */}
      <div className="card bg-blue-50 border border-blue-100">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">¿Qué contiene cada reporte?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p className="font-medium mb-1">Informe Clínico del Residente</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>Datos personales y clínicos</li>
              <li>Historial de signos vitales con alertas</li>
              <li>Adherencia terapéutica de medicamentos</li>
              <li>Registros de actividades y cuidadores</li>
              <li>Incidentes ocurridos en el período</li>
              <li>Bloque de firma del médico tratante</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">Reporte de Turno Diario</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-700">
              <li>Resumen estadístico del turno actual</li>
              <li>Estado de todos los residentes activos</li>
              <li>Registro de alimentación por comida</li>
              <li>Medicamentos administrados vs pendientes</li>
              <li>Incidentes reportados en el día</li>
              <li>Identificación del turno (mañana/tarde/noche)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
