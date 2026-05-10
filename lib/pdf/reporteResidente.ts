import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import api from '@/lib/api'

// ── Brand colors ─────────────────────────────────────────────────────────────
const DARK   = '#085041'
const PRIMARY = '#1D9E75'
const WHITE  = '#FFFFFF'

// ── Types ────────────────────────────────────────────────────────────────────
interface Residente {
  id: string
  nombre: string
  apellido: string
  edad: number
  fecha_nacimiento: string
  fecha_ingreso: string
  habitacion?: string
  nivel_dependencia?: string
  medico_tratante?: string
  diagnosticos?: string
  alergias?: string
  tipo_sangre?: string
  eps?: string
  afiliacion?: string
  genero?: string
  documento?: string
  foto_url?: string
  estado: string
}

interface Vital {
  fecha_hora: string
  presion_sistolica?: number
  presion_diastolica?: number
  frecuencia_cardiaca?: number
  saturacion_o2?: number
  temperatura?: number
  glucosa?: number
  peso?: number
  registrado_por_nombre?: string
}

interface VitalesResumen {
  avg_sistolica?: number
  avg_diastolica?: number
  avg_glucosa?: number
  avg_temperatura?: number
  avg_peso?: number
  min_spo2?: number
  max_sistolica?: number
}

interface AlertaClinica {
  fecha_hora: string
  alerta_descripcion?: string
  presion_sistolica?: number
  presion_diastolica?: number
}

interface Medicamento {
  nombre: string
  dosis?: string
  unidad?: string
  via?: string
  frecuencia?: string
  total_administradas: number
  total_programadas: number
  adherencia_pct?: number
}

interface Actividad {
  fecha_hora: string
  turno?: string
  estado_emocional?: string
  desayuno_pct?: number
  almuerzo_pct?: number
  cena_pct?: number
  observaciones?: string
  cuidador_nombre?: string
}

interface Incidente {
  fecha_hora: string
  tipo?: string
  severidad?: string
  descripcion?: string
  resuelto?: boolean
  resuelto_en?: string
}

interface ReporteData {
  residente: Residente
  vitales: Vital[]
  vitales_resumen: VitalesResumen
  alertas_clinicas: AlertaClinica[]
  medicamentos: Medicamento[]
  actividades: Actividad[]
  incidentes: Incidente[]
  periodo: { desde: string; hasta: string }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return iso }
}

function fmtFechaHora(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function addFooters(doc: jsPDF, totalPages: number) {
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    const pageH = 297
    // Thin green line
    doc.setDrawColor(DARK)
    doc.setLineWidth(0.3)
    doc.line(15, pageH - 12, 195, pageH - 12)
    // Left text
    doc.setFontSize(7)
    doc.setTextColor('#555555')
    doc.text('Casa Geriátrica Mafe – Confidencial – Uso médico exclusivo', 15, pageH - 8)
    // Right page number
    doc.text(`Página ${i} de ${totalPages}`, 195, pageH - 8, { align: 'right' })
  }
}

function sectionHeader(doc: jsPDF, title: string, y: number, bgColor = DARK): number {
  doc.setFillColor(bgColor)
  doc.rect(15, y, 180, 7, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text(title.toUpperCase(), 18, y + 5)
  doc.setTextColor('#1a1a1a')
  doc.setFont('helvetica', 'normal')
  return y + 10
}

function checkPageBreak(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 275) {
    doc.addPage()
    return 20
  }
  return y
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function generarReporteResidente(
  residenteId: string,
  periodo: { desde: string; hasta: string; label: string },
): Promise<void> {
  // Fetch data
  const { data } = await api.get<ReporteData>(
    `/reportes/residente/${residenteId}`,
    { params: { desde: periodo.desde, hasta: periodo.hasta } },
  )

  const { residente, vitales, vitales_resumen, alertas_clinicas, medicamentos, actividades, incidentes } = data

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── PAGE 1: COVER ──────────────────────────────────────────────────────────

  // Dark green header rectangle
  doc.setFillColor(DARK)
  doc.rect(0, 0, 210, 55, 'F')

  // Logo: green rectangle with "M"
  doc.setFillColor(PRIMARY)
  doc.rect(15, 8, 22, 22, 'F')
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text('M', 26, 23, { align: 'center' })

  // Institution name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(WHITE)
  doc.text('CASA GERIÁTRICA MAFE', 42, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(204, 230, 222)   // white/80 equivalente en RGB
  doc.text('Informe Clínico del Residente', 42, 23)

  doc.setFontSize(8)
  doc.setTextColor(WHITE)
  doc.text('NIT 900.XXX.XXX-X · Bogotá, Colombia', 42, 29)

  // Light green horizontal line below header
  doc.setDrawColor(PRIMARY)
  doc.setLineWidth(0.8)
  doc.line(0, 55, 210, 55)

  // ── Resident info block ──
  let y = 65

  // Photo / initials circle
  const iniciales = `${residente.nombre[0] ?? ''}${residente.apellido[0] ?? ''}`.toUpperCase()
  const fotoX = 155
  const fotoY = 62
  const fotoW = 35
  const fotoH = 42

  if (residente.foto_url) {
    try {
      doc.addImage(residente.foto_url, 'JPEG', fotoX, fotoY, fotoW, fotoH)
    } catch {
      // fallback: drawn circle with initials
      doc.setFillColor(PRIMARY)
      doc.circle(fotoX + fotoW / 2, fotoY + fotoH / 2, 18, 'F')
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(WHITE)
      doc.text(iniciales, fotoX + fotoW / 2, fotoY + fotoH / 2 + 5, { align: 'center' })
    }
  } else {
    doc.setFillColor(PRIMARY)
    doc.circle(fotoX + fotoW / 2, fotoY + fotoH / 2, 18, 'F')
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(WHITE)
    doc.text(iniciales, fotoX + fotoW / 2, fotoY + fotoH / 2 + 5, { align: 'center' })
  }

  // Resident name
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK)
  doc.text(`${residente.nombre} ${residente.apellido}`, 15, y)
  y += 8

  // Age + room + dependency badge
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#444444')
  const subInfo: string[] = []
  if (residente.edad) subInfo.push(`${residente.edad} años`)
  if (residente.habitacion) subInfo.push(`Hab. ${residente.habitacion}`)
  doc.text(subInfo.join('  ·  '), 15, y)
  y += 6

  if (residente.nivel_dependencia) {
    doc.setFillColor('#e8f5f0')
    doc.setDrawColor(PRIMARY)
    doc.setLineWidth(0.3)
    doc.roundedRect(15, y, 50, 7, 2, 2, 'FD')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK)
    const depLabel = `Dependencia: ${residente.nivel_dependencia}`
    doc.text(depLabel.toUpperCase(), 40, y + 4.5, { align: 'center' })
    y += 11
  }

  // Period box
  y += 4
  doc.setFillColor('#f8fdf9')
  doc.setDrawColor(PRIMARY)
  doc.setLineWidth(0.4)
  doc.roundedRect(15, y, 120, 18, 3, 3, 'FD')
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK)
  doc.text('PERÍODO DEL INFORME', 18, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor('#333333')
  doc.setFontSize(9)
  doc.text(`${fmtFecha(periodo.desde)}  →  ${fmtFecha(periodo.hasta)}  (${periodo.label})`, 18, y + 13)
  y += 24

  // Generation date
  doc.setFontSize(8)
  doc.setTextColor('#888888')
  doc.text(`Generado el: ${fmtFechaHora(new Date().toISOString())}`, 15, y)
  y += 6

  // "Confidencial" footer on cover page
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#cc0000')
  doc.text('CONFIDENCIAL – USO MÉDICO EXCLUSIVO', 105, 285, { align: 'center' })
  doc.setTextColor('#333333')
  doc.setFont('helvetica', 'normal')

  // ── PAGE 2+: CONTENT ────────────────────────────────────────────────────────
  doc.addPage()
  y = 20

  // ── Section: Datos Clínicos ──
  y = sectionHeader(doc, 'Datos Clínicos', y)
  y += 2

  const col1X = 15
  const col2X = 110
  const lineH = 6.5

  doc.setFontSize(9)

  // Left column: personal data
  const leftFields: [string, string][] = [
    ['Documento',     residente.documento ?? '—'],
    ['Género',        residente.genero ?? '—'],
    ['Tipo de sangre', residente.tipo_sangre ?? '—'],
    ['EPS',           residente.eps ?? '—'],
    ['Afiliación',    residente.afiliacion ?? '—'],
    ['F. Nacimiento', fmtFecha(residente.fecha_nacimiento)],
    ['F. Ingreso',    fmtFecha(residente.fecha_ingreso)],
  ]

  // Right column: clinical data
  const rightFields: [string, string][] = [
    ['Dependencia',   residente.nivel_dependencia ?? '—'],
    ['Médico tratante', residente.medico_tratante ?? '—'],
    ['Estado',        residente.estado],
  ]

  const startY = y
  leftFields.forEach(([label, value], i) => {
    const fy = startY + i * lineH
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK)
    doc.text(`${label}:`, col1X, fy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#333333')
    doc.text(String(value), col1X + 32, fy)
  })

  rightFields.forEach(([label, value], i) => {
    const fy = startY + i * lineH
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK)
    doc.text(`${label}:`, col2X, fy)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#333333')
    const maxW = 80
    const lines = doc.splitTextToSize(String(value), maxW)
    doc.text(lines, col2X + 35, fy)
  })

  y = startY + Math.max(leftFields.length, rightFields.length) * lineH + 4

  // Diagnósticos
  if (residente.diagnosticos) {
    y = checkPageBreak(doc, y, 20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(DARK)
    doc.setFontSize(9)
    doc.text('Diagnósticos:', col2X, startY + 3 * lineH)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#333333')
    const diagLines = doc.splitTextToSize(residente.diagnosticos, 85)
    doc.text(diagLines, col2X + 35, startY + 3 * lineH)
    y = Math.max(y, startY + (3 + diagLines.length) * lineH + 4)
  }

  // Alergias (red box)
  if (residente.alergias) {
    y = checkPageBreak(doc, y, 20)
    doc.setFillColor('#fff0f0')
    doc.setDrawColor('#cc0000')
    doc.setLineWidth(0.4)
    const alergiasText = `⚠ ALERGIAS: ${residente.alergias}`
    const alergiasLines = doc.splitTextToSize(alergiasText, 170)
    const boxH = alergiasLines.length * 5 + 6
    doc.roundedRect(15, y, 180, boxH, 2, 2, 'FD')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#cc0000')
    doc.text(alergiasLines, 18, y + 5)
    doc.setTextColor('#333333')
    doc.setFont('helvetica', 'normal')
    y += boxH + 6
  }

  // ── Section: Signos Vitales ──
  if (vitales.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionHeader(doc, 'Signos Vitales – Resumen del Período', y)

    // Summary cards
    const resumen = vitales_resumen
    const cards = [
      { label: 'Presión promedio', value: resumen.avg_sistolica && resumen.avg_diastolica ? `${resumen.avg_sistolica}/${resumen.avg_diastolica} mmHg` : '—' },
      { label: 'Glucosa prom.', value: resumen.avg_glucosa ? `${resumen.avg_glucosa} mg/dL` : '—' },
      { label: 'Temperatura prom.', value: resumen.avg_temperatura ? `${resumen.avg_temperatura} °C` : '—' },
      { label: 'Peso promedio', value: resumen.avg_peso ? `${resumen.avg_peso} kg` : '—' },
    ]

    const cardW = 42
    const cardH = 16
    const cardGap = 6
    const totalCardsW = cards.length * cardW + (cards.length - 1) * cardGap
    const cardStartX = 15 + (180 - totalCardsW) / 2

    cards.forEach((card, i) => {
      const cx = cardStartX + i * (cardW + cardGap)
      doc.setFillColor('#f0faf5')
      doc.setDrawColor(PRIMARY)
      doc.setLineWidth(0.3)
      doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'FD')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor('#666666')
      doc.text(card.label, cx + cardW / 2, y + 5, { align: 'center' })
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(DARK)
      doc.text(card.value, cx + cardW / 2, y + 12, { align: 'center' })
    })
    y += cardH + 6

    // Vitals table (max 20 records)
    const vitalesSlice = vitales.slice(0, 20)
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'TA (mmHg)', 'FC (bpm)', 'SpO₂ (%)', 'Temp (°C)', 'Glucosa (mg/dL)', 'Peso (kg)']],
      body: vitalesSlice.map(v => [
        fmtFechaHora(v.fecha_hora),
        v.presion_sistolica && v.presion_diastolica ? `${v.presion_sistolica}/${v.presion_diastolica}` : '—',
        v.frecuencia_cardiaca ?? '—',
        v.saturacion_o2 ?? '—',
        v.temperatura ?? '—',
        v.glucosa ?? '—',
        v.peso ?? '—',
      ]),
      headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: '#333333' },
      alternateRowStyles: { fillColor: '#f8fdf9' },
      columnStyles: { 0: { cellWidth: 35 } },
      margin: { left: 15, right: 15 },
      didParseCell: (hookData) => {
        if (hookData.section === 'body') {
          const row = vitalesSlice[hookData.row.index]
          if (!row) return
          const col = hookData.column.index
          let outOfRange = false
          if (col === 1 && row.presion_sistolica && (row.presion_sistolica > 160 || row.presion_sistolica < 90)) outOfRange = true
          if (col === 2 && row.frecuencia_cardiaca && (row.frecuencia_cardiaca > 100 || row.frecuencia_cardiaca < 50)) outOfRange = true
          if (col === 3 && row.saturacion_o2 && row.saturacion_o2 < 92) outOfRange = true
          if (col === 4 && row.temperatura && (row.temperatura > 38 || row.temperatura < 35.5)) outOfRange = true
          if (col === 5 && row.glucosa && (row.glucosa > 250 || row.glucosa < 70)) outOfRange = true
          if (outOfRange) hookData.cell.styles.textColor = '#cc0000'
        }
      },
    })
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8
  }

  // ── Section: Alertas Clínicas ──
  if (alertas_clinicas.length > 0) {
    y = checkPageBreak(doc, y, 25)
    y = sectionHeader(doc, `Alertas Clínicas (${alertas_clinicas.length})`, y, '#cc0000')

    autoTable(doc, {
      startY: y,
      head: [['Fecha y Hora', 'Descripción de la Alerta']],
      body: alertas_clinicas.map(a => [
        fmtFechaHora(a.fecha_hora),
        a.alerta_descripcion ?? '—',
      ]),
      headStyles: { fillColor: '#cc0000', textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, fillColor: '#fff5f5', textColor: '#880000' },
      columnStyles: { 0: { cellWidth: 40 } },
      margin: { left: 15, right: 15 },
    })
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8
  }

  // ── Section: Medicamentos ──
  if (medicamentos.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionHeader(doc, 'Medicamentos – Adherencia Terapéutica', y)

    autoTable(doc, {
      startY: y,
      head: [['Medicamento', 'Dosis', 'Vía', 'Frecuencia', 'Administ.', 'Program.', 'Adherencia %']],
      body: medicamentos.map(m => [
        m.nombre,
        m.dosis ? `${m.dosis} ${m.unidad ?? ''}`.trim() : '—',
        m.via ?? '—',
        m.frecuencia ?? '—',
        String(m.total_administradas ?? 0),
        String(m.total_programadas ?? 0),
        m.adherencia_pct != null ? `${m.adherencia_pct}%` : '—',
      ]),
      headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: '#333333' },
      alternateRowStyles: { fillColor: '#f8fdf9' },
      margin: { left: 15, right: 15 },
      willDrawCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 6) {
          const med = medicamentos[hookData.row.index]
          if (!med) return
          const pct = med.adherencia_pct ?? 0
          if (pct >= 80) hookData.cell.styles.textColor = '#1a7a4a'
          else if (pct >= 60) hookData.cell.styles.textColor = '#b07a00'
          else hookData.cell.styles.textColor = '#cc0000'
          hookData.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8
  }

  // ── Section: Actividades ──
  if (actividades.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionHeader(doc, 'Actividades y Registros del Cuidador', y)

    const actividadesSlice = actividades.slice(0, 15)
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Turno', 'E. Emocional', 'Desayuno %', 'Almuerzo %', 'Cena %', 'Observaciones']],
      body: actividadesSlice.map(a => [
        fmtFechaHora(a.fecha_hora),
        a.turno ?? '—',
        a.estado_emocional ?? '—',
        a.desayuno_pct != null ? `${a.desayuno_pct}%` : '—',
        a.almuerzo_pct != null ? `${a.almuerzo_pct}%` : '—',
        a.cena_pct != null ? `${a.cena_pct}%` : '—',
        a.observaciones ?? '—',
      ]),
      headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: '#333333' },
      alternateRowStyles: { fillColor: '#f8fdf9' },
      columnStyles: { 0: { cellWidth: 32 }, 6: { cellWidth: 50 } },
      margin: { left: 15, right: 15 },
    })
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8
  }

  // ── Section: Incidentes ──
  if (incidentes.length > 0) {
    y = checkPageBreak(doc, y, 30)
    y = sectionHeader(doc, `Incidentes del Período (${incidentes.length})`, y)

    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Tipo', 'Severidad', 'Estado', 'Descripción']],
      body: incidentes.map(i => [
        fmtFechaHora(i.fecha_hora),
        i.tipo ?? '—',
        i.severidad ?? '—',
        i.resuelto ? 'Resuelto' : 'Abierto',
        i.descripcion ?? '—',
      ]),
      headStyles: { fillColor: DARK, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5, textColor: '#333333' },
      alternateRowStyles: { fillColor: '#f8fdf9' },
      columnStyles: { 0: { cellWidth: 33 }, 4: { cellWidth: 65 } },
      margin: { left: 15, right: 15 },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const inc = incidentes[hookData.row.index]
          if (inc && !inc.resuelto) hookData.cell.styles.textColor = '#cc0000'
          else hookData.cell.styles.textColor = '#1a7a4a'
        }
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const inc = incidentes[hookData.row.index]
          if (inc?.severidad === 'critico' || inc?.severidad === 'grave') {
            hookData.cell.styles.textColor = '#cc0000'
          }
        }
      },
    })
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8
  }

  // ── Digital signature block ──
  y = checkPageBreak(doc, y, 40)
  y += 10
  doc.setDrawColor('#cccccc')
  doc.setLineWidth(0.3)
  doc.roundedRect(15, y, 180, 38, 2, 2, 'D')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(DARK)
  doc.text(`Dr./Dra. ${residente.medico_tratante ?? '________________________'}`, 105, y + 10, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor('#555555')
  doc.text('Médico Tratante', 105, y + 16, { align: 'center' })

  doc.setDrawColor('#999999')
  doc.line(35, y + 30, 90, y + 30)
  doc.line(120, y + 30, 175, y + 30)
  doc.setFontSize(7)
  doc.text('Fecha', 62, y + 34, { align: 'center' })
  doc.text('Firma', 147, y + 34, { align: 'center' })

  doc.setFontSize(7)
  doc.setTextColor('#999999')
  doc.text('Firmado digitalmente por el sistema Mafe', 105, y + 38, { align: 'center' })

  // ── Add footers to all pages ──
  const totalPages = doc.getNumberOfPages()
  addFooters(doc, totalPages)

  // ── Download ──
  const apellidoClean = residente.apellido.replace(/\s+/g, '_')
  const filename = `Informe_${apellidoClean}_${periodo.desde}_${periodo.hasta}.pdf`
  doc.save(filename)
}
