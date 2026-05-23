import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Presupuesto, Venta } from '../types'

// ─── Paleta de colores (coincide con el tema Tailwind de la app) ──────────────
const COLOR_HEADER_BG: [number, number, number]  = [30, 41, 59]    // slate-800
const COLOR_HEADER_TXT: [number, number, number] = [255, 255, 255]
const COLOR_ALT_ROW: [number, number, number]    = [248, 250, 252]  // slate-50
const COLOR_AMBER: [number, number, number]      = [217, 119, 6]    // amber-600
const COLOR_SLATE_DARK: [number, number, number] = [51, 65, 85]     // slate-700
const COLOR_SLATE_MID: [number, number, number]  = [100, 116, 139]  // slate-500
const COLOR_BORDER: [number, number, number]     = [226, 232, 240]  // slate-200

// ─── Tipo interno normalizado ─────────────────────────────────────────────────
interface DatosDocumento {
  tipo: 'PRESUPUESTO' | 'VENTA'
  numero: string
  fecha: string
  clienteNombre: string
  detalles: Array<{
    descripcionItem: string
    cantidad: number
    precioUnitarioNeto: number
    alicuotaIva: number
    subtotal: number
  }>
  subtotalNeto: number
  totalIva: number
  total: number
}

// ─── Elimina tildes y caracteres especiales para evitar problemas con jsPDF ───
function sanitize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// ─── Formatea un número como moneda argentina ─────────────────────────────────
function formatCurrency(n: number): string {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 })
}

// ─── Mappers ──────────────────────────────────────────────────────────────────
function presupuestoToDatos(p: Presupuesto): DatosDocumento {
  return {
    tipo: 'PRESUPUESTO',
    numero: p.numero,
    fecha: p.fecha,
    clienteNombre: p.clienteNombre,
    detalles: p.detalles.map(d => ({
      descripcionItem: d.descripcionItem,
      cantidad: d.cantidad,
      precioUnitarioNeto: d.precioUnitarioNeto,
      alicuotaIva: d.alicuotaIva,
      subtotal: d.subtotal,
    })),
    subtotalNeto: p.subtotalNeto,
    totalIva: p.totalIva,
    total: p.total,
  }
}

function ventaToDatos(v: Venta): DatosDocumento {
  return {
    tipo: 'VENTA',
    numero: v.numero,
    fecha: v.fecha,
    clienteNombre: v.clienteNombre,
    detalles: v.detalles.map(d => ({
      descripcionItem: d.descripcionItem,
      cantidad: d.cantidad,
      precioUnitarioNeto: d.precioUnitarioNeto,
      alicuotaIva: d.alicuotaIva,
      subtotal: d.subtotal,
    })),
    subtotalNeto: v.subtotalNeto,
    totalIva: v.totalIva,
    total: v.total,
  }
}

// ─── Generador principal ──────────────────────────────────────────────────────
function generarPdf(datos: DatosDocumento): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Cabecera ────────────────────────────────────────────────────────────────
  // "Taller SAE" — bold 18pt slate-700
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLOR_SLATE_DARK)
  doc.text('Taller SAE', 14, 22)

  // Tipo de documento — bold 11pt amber, alineado a la derecha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_AMBER)
  doc.text(datos.tipo, 196, 16, { align: 'right' })

  // Número — normal 10pt slate-500, alineado a la derecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_SLATE_MID)
  doc.text(`#${datos.numero}`, 196, 22, { align: 'right' })

  // Línea separadora
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.line(14, 28, 196, 28)

  // ── Datos del cliente ────────────────────────────────────────────────────────
  // "Cliente:" label
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_SLATE_MID)
  doc.text('Cliente:', 14, 36)

  // Valor del cliente — bold slate-700
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...COLOR_SLATE_DARK)
  doc.text(sanitize(datos.clienteNombre), 33, 36)

  // "Fecha:" label
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_SLATE_MID)
  doc.text('Fecha:', 14, 42)

  // Valor de la fecha — normal slate-700
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...COLOR_SLATE_DARK)
  doc.text(datos.fecha, 33, 42)

  // ── Tabla de detalles ────────────────────────────────────────────────────────
  const bodyRows = datos.detalles.map(d => [
    sanitize(d.descripcionItem),
    d.cantidad.toString(),
    formatCurrency(d.precioUnitarioNeto),
    `${d.alicuotaIva}%`,
    formatCurrency(d.subtotal),
  ])

  autoTable(doc, {
    startY: 50,
    head: [['Descripcion', 'Cant.', 'Precio neto', 'IVA %', 'Subtotal c/IVA']],
    body: bodyRows,
    headStyles: {
      fillColor: COLOR_HEADER_BG,
      textColor: COLOR_HEADER_TXT,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: COLOR_ALT_ROW,
    },
    columnStyles: {
      0: { cellWidth: 75 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 33, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 33, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  })

  // ── Bloque de totales ────────────────────────────────────────────────────────
  const finalY: number = (doc as any).lastAutoTable?.finalY ?? 180
  const xLabel = 130
  const xValue = 196
  let yTot = finalY + 10

  // Subtotal neto
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_SLATE_MID)
  doc.text('Subtotal neto:', xLabel, yTot)
  doc.setTextColor(...COLOR_SLATE_DARK)
  doc.text(formatCurrency(datos.subtotalNeto), xValue, yTot, { align: 'right' })

  yTot += 7

  // IVA total
  doc.setTextColor(...COLOR_SLATE_MID)
  doc.text('IVA total:', xLabel, yTot)
  doc.setTextColor(...COLOR_SLATE_DARK)
  doc.text(formatCurrency(datos.totalIva), xValue, yTot, { align: 'right' })

  yTot += 4

  // Línea fina separadora
  doc.setDrawColor(...COLOR_BORDER)
  doc.setLineWidth(0.3)
  doc.line(xLabel, yTot, xValue, yTot)

  yTot += 6

  // TOTAL — bold amber 11pt
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COLOR_AMBER)
  doc.text('TOTAL:', xLabel, yTot)
  doc.text(formatCurrency(datos.total), xValue, yTot, { align: 'right' })

  // ── Pie de página ────────────────────────────────────────────────────────────
  const fechaGeneracion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)  // slate-400
  doc.text(`Generado el ${fechaGeneracion}`, 105, 285, { align: 'center' })

  // ── Guardar ──────────────────────────────────────────────────────────────────
  doc.save(`${datos.tipo.toLowerCase()}_${datos.numero}.pdf`)
}

// ─── API pública ──────────────────────────────────────────────────────────────
export function generarPdfPresupuesto(presupuesto: Presupuesto): void {
  generarPdf(presupuestoToDatos(presupuesto))
}

export function generarPdfVenta(venta: Venta): void {
  generarPdf(ventaToDatos(venta))
}
