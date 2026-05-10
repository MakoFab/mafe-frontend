import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '@/lib/api'

// ── Brand colors ─────────────────────────────────────────────────────────────
const DARK    = '#085041'
const PRIMARY = '#1D9E75'
const WHITE   = '#FFFFFF'

// ── Types ────────────────────────────────────────────────────────────────────
interface RegistroHoy {
  turno?: string
  estado_emocional?: string
  desayuno_pct?: number
  almuerzo_pct?: number
  cena_pct?: number
  observaciones?: string
  cuidador_nombre?: string
}

interface ResidenteTurno {
  nombre: string
  habitacion?: string
  nivel_dependencia?: string
  registro_hoy: RegistroHoy | null
  meds_total: number
  meds_administrados: number
  meds_pendientes: number
  incidentes_hoy: number
}

interface ResumenTurno {
  total_residentes: number
  con_registro: number
  sin_registro: number
  total_incidentes_hoy: number
  total_meds_pendientes: number
}

interface TurnoData {
  fecha: string
  turno: 'mañana' | 'tarde' | 'noche'
  generado_en: string
  residentes: ResidenteTurno[]
  resumen: ResumenTurno
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch { return iso }
}

function fmtHora(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

function turnoLabel(turno: string): string {
  const map: Record<string, string> = { 'mañana': 'Turno Mañana (6:00–14:00)', tarde: 'Turno Tarde (14:00–22:00)', noche: 'Turno Noche (22:00–6:00)' }
  return map[turno] ?? turno
}

function addFooters(doc: jsPDF, totalPages: number) {
  const pageH = 210 // landscape A4 height
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(DARK)
    doc.setLineWidth(0.3)
    doc.line(15, pageH - 12, 282, pageH - 12)
    doc.setFontSize(7)
    doc.setTextColor('#555555')
    doc.text('Casa Geriátrica Mafe – Reporte de Turno – Confidencial', 15, pageH - 8)
    doc.text(`Página ${i} de ${totalPages}`, 282, pageH - 8, { align: 'right' })
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generarReporteTurno(): Promise<void> {
  const { data } = await api.get<TurnoData>('/reportes/turno')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  // Landscape A4: 297mm wide, 210mm tall

  // ── Header ──
  doc.setFillColor(DARK)
  doc.rect(0, 0, 297, 45, 'F')

  // Logo
  doc.setFillColor(PRIMARY)
  doc.rect(15, 8, 18, 18, 'F')
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text('M', 24, 20, { align: 'center' })

  // Title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text('CASA GERIÁTRICA MAFE', 40, 15)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Turno Diario', 40, 22)

  // Turno badge on right
  doc.setFillColor(PRIMARY)
  doc.roundedRect(200, 10, 80, 12, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text(turnoLabel(data.turno).toUpperCase(), 240, 18, { align: 'center' })

  // Date below turno
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtFecha(data.fecha), 240, 26, { align: 'center' })

  // Generation time
  doc.setFontSize(7)
  doc.setTextColor(179, 217, 207)   // white/70 equivalente en RGB
  doc.text(`Generado: ${fmtHora(data.generado_en)}`, 240, 32, { align: 'center' })

  // Light green line
  doc.setDrawColor(PRIMARY)
  doc.setLineWidth(0.6)
  doc.line(0, 45, 297, 45)

  let y = 55

  // ── Summary stat boxes ──
  const resumen = data.resumen
  const statCards = [
    { label: 'Total Residentes',     value: String(resumen.total_residentes) },
    { label: 'Con Registro Hoy',     value: String(resumen.con_registro),     color: '#1a7a4a' },
    { label: 'Sin Registro',         value: String(resumen.sin_registro),     color: resumen.sin_registro > 0 ? '#cc0000' : '#333333' },
    { label: 'Incidentes Hoy',       value: String(resumen.total_incidentes_hoy), color: resumen.total_incidentes_hoy > 0 ? '#b07a00' : '#333333' },
    { label: 'Meds Pendientes',      value: String(resumen.total_meds_pendientes), color: resumen.total_meds_pendientes > 0 ? '#cc0000' : '#333333' },
  ]

  const cardW = 48
  const cardH = 18
  const cardGap = 4
  const totalW = statCards.length * cardW + (statCards.length - 1) * cardGap
  const startX = 15 + (267 - totalW) / 2

  statCards.forEach((card, i) => {
    const cx = startX + i * (cardW + cardGap)
    doc.setFillColor('#f0faf5')
    doc.setDrawColor(PRIMARY)
    doc.setLineWidth(0.3)
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#666666')
    doc.text(card.label, cx + cardW / 2, y + 6, { align: 'center' })
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(card.color ?? DARK)
    doc.text(card.value, cx + cardW / 2, y + 14, { align: 'center' })
  })

  y += cardH + 8

  // ── Main table ──
  autoTable(doc, {
    startY: y,
    head: [['Hab.', 'Residente', 'Dependencia', 'Turno Reg.', 'E. Emocional', 'Desayuno', 'Almuerzo', 'Cena', 'Meds', 'Incidentes', 'Estado']],
    body: data.residentes.map(r => {
      const reg = r.registro_hoy
      return [
        r.habitacion ?? '—',
        r.nombre,
        r.nivel_dependencia ?? '—',
        reg?.turno ?? '—',
        reg?.estado_emocional ?? '—',
        reg?.desayuno_pct != null ? `${reg.desayuno_pct}%` : '—',
        reg?.almuerzo_pct != null ? `${reg.almuerzo_pct}%` : '—',
        reg?.cena_pct != null ? `${reg.cena_pct}%` : '—',
        `${r.meds_administrados}/${r.meds_total}`,
        String(r.incidentes_hoy),
        reg ? 'Con registro' : 'Sin registro',
      ]
    }),
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: '#333333',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: '#f8fdf9' },
    columnStyles: {
      0: { cellWidth: 14 },
      1: { cellWidth: 38, halign: 'left' },
      2: { cellWidth: 24 },
      3: { cellWidth: 20 },
      4: { cellWidth: 22 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 18 },
      8: { cellWidth: 20 },
      9: { cellWidth: 20 },
      10: { cellWidth: 25 },
    },
    margin: { left: 15, right: 15 },
    willDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 10) {
        const res = data.residentes[hookData.row.index]
        if (!res) return
        if (res.registro_hoy) {
          hookData.cell.styles.textColor = '#1a7a4a'
          hookData.cell.styles.fontStyle = 'bold'
        } else {
          hookData.cell.styles.textColor = '#cc0000'
          hookData.cell.styles.fontStyle = 'bold'
        }
      }
      if (hookData.section === 'body' && hookData.column.index === 9) {
        const res = data.residentes[hookData.row.index]
        if (!res) return
        if (res.incidentes_hoy > 0) {
          hookData.cell.styles.textColor = '#b07a00'
          hookData.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // ── Footers ──
  const totalPages = doc.getNumberOfPages()
  addFooters(doc, totalPages)

  // ── Download ──
  const turnoSlug = data.turno.replace('ñ', 'n')
  const filename = `Turno_${turnoSlug}_${data.fecha}.pdf`
  doc.save(filename)
}
