'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import api from '@/lib/api'
import { Residente } from '@/types'
import { formatFecha, calcularEdad } from '@/lib/utils'
import ResidenteEstado from '@/components/residentes/ResidenteEstado'
import Spinner from '@/components/ui/Spinner'

type PeriodoPDF = '7' | '30' | '90'

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]
}

const TABS = [
  { href: '',             label: 'Perfil' },
  { href: '/registros',   label: 'Registros' },
  { href: '/medicamentos',label: 'Medicamentos' },
  { href: '/vitales',     label: 'Signos vitales' },
  { href: '/fotos',       label: 'Fotos' },
]

export default function ResidenteLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const [residente, setResidente] = useState<Residente | null>(null)
  const [showPdfMenu, setShowPdfMenu] = useState(false)
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [pdfPeriodo, setPdfPeriodo] = useState<PeriodoPDF>('30')

  useEffect(() => {
    api.get<Residente>(`/residentes/${id}`).then(r => setResidente(r.data))
  }, [id])

  // Close pdf menu when clicking outside
  useEffect(() => {
    if (!showPdfMenu) return
    function handleClick(e: MouseEvent) {
      const el = document.getElementById('pdf-menu-container')
      if (el && !el.contains(e.target as Node)) setShowPdfMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPdfMenu])

  async function handleGenerarPDF() {
    if (!residente) return
    setLoadingPdf(true)
    try {
      const { generarReporteResidente } = await import('@/lib/pdf/reporteResidente')
      const hoy = new Date()
      const dias = Number(pdfPeriodo)
      const desde = toISO(addDays(hoy, -dias))
      const hasta = toISO(hoy)
      const labels: Record<PeriodoPDF, string> = { '7': 'Última semana', '30': 'Último mes', '90': 'Últimos 3 meses' }
      await generarReporteResidente(id, { desde, hasta, label: labels[pdfPeriodo] })
    } catch (err) {
      console.error('Error generando PDF:', err)
    } finally {
      setLoadingPdf(false)
      setShowPdfMenu(false)
    }
  }

  if (!residente) return <Spinner />

  const edad = residente.edad ?? calcularEdad(residente.fecha_nacimiento)
  const iniciales = `${residente.nombre[0]}${residente.apellido[0]}`.toUpperCase()
  const base = `/residentes/${id}`

  return (
    <div>
      {/* Encabezado del residente */}
      <div className="card mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-mafe-claro flex items-center justify-center text-mafe-oscuro font-bold text-xl shrink-0">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                {residente.nombre} {residente.apellido}
              </h1>
              <ResidenteEstado estado={residente.estado} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-500 mt-2">
              <span><span className="font-medium text-gray-700">Edad:</span> {edad} años</span>
              <span><span className="font-medium text-gray-700">Hab.:</span> {residente.habitacion ?? '—'}</span>
              <span><span className="font-medium text-gray-700">Ingreso:</span> {formatFecha(residente.fecha_ingreso)}</span>
              <span><span className="font-medium text-gray-700">EPS:</span> {residente.eps ?? '—'}</span>
              {residente.tipo_sangre && (
                <span><span className="font-medium text-gray-700">Sangre:</span> {residente.tipo_sangre}</span>
              )}
              {residente.nivel_dependencia && (
                <span className="capitalize"><span className="font-medium text-gray-700">Dependencia:</span> {residente.nivel_dependencia}</span>
              )}
              {residente.medico_tratante && (
                <span className="col-span-2"><span className="font-medium text-gray-700">Médico:</span> {residente.medico_tratante}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0 self-start">
            <Link href={`/residentes/${id}/editar`} className="btn-secondary text-sm">
              Editar
            </Link>
            {/* PDF button with inline period selector */}
            <div id="pdf-menu-container" className="relative">
              <button
                onClick={() => setShowPdfMenu(v => !v)}
                className="btn-secondary text-sm"
                title="Generar informe PDF"
              >
                📄 Informe PDF
              </button>
              {showPdfMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Período del informe</p>
                  <div className="space-y-2 mb-3">
                    {([
                      { value: '7' as PeriodoPDF,  label: 'Última semana (7 días)' },
                      { value: '30' as PeriodoPDF, label: 'Último mes (30 días)' },
                      { value: '90' as PeriodoPDF, label: 'Últimos 3 meses (90 días)' },
                    ]).map(opt => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pdf-periodo"
                          value={opt.value}
                          checked={pdfPeriodo === opt.value}
                          onChange={() => setPdfPeriodo(opt.value)}
                          className="accent-mafe"
                        />
                        <span className="text-sm text-gray-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerarPDF}
                    disabled={loadingPdf}
                    className="btn-primary w-full text-sm"
                  >
                    {loadingPdf ? 'Generando...' : 'Descargar PDF'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
        {TABS.map(tab => {
          const href = `${base}${tab.href}`
          const activo = tab.href === ''
            ? pathname === base
            : pathname.startsWith(href)
          return (
            <Link
              key={tab.href}
              href={href}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activo
                  ? 'border-mafe text-mafe'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
