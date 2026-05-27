// frontend/src/utils/exportToPDF.js

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Export elemen HTML ke PDF
 * @param {HTMLElement} element - Elemen DOM yang akan di-capture
 * @param {string} filename - Nama file PDF (tanpa .pdf)
 * @returns {Promise<void>}
 */
export async function exportToPDF(element, filename = 'adshight-report') {
  if (!element) {
    throw new Error('Element tidak ditemukan untuk export PDF')
  }

  try {
    // Capture elemen ke canvas dengan kualitas tinggi
    const canvas = await html2canvas(element, {
      scale: 2, // Resolusi tinggi
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#030712', // gray-950
      logging: false,
      // Pastikan semua elemen terrender
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-report-template]')
        if (clonedElement) {
          clonedElement.style.transform = 'none'
          clonedElement.style.position = 'relative'
          clonedElement.style.left = '0'
          clonedElement.style.top = '0'
        }
      }
    })

    const imgData = canvas.toDataURL('image/png')

    // Setup PDF — A4 portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Margin
    const margin = 10
    const contentWidth = pageWidth - margin * 2

    // Hitung tinggi gambar proporsional
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = contentWidth / imgWidth
    const scaledHeight = imgHeight * ratio

    // Jika konten muat dalam 1 halaman
    if (scaledHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, scaledHeight)
    } else {
      // Multi-page: potong gambar per halaman
      const availableHeight = pageHeight - margin * 2
      let remainingHeight = scaledHeight
      let position = 0
      let pageNum = 0

      while (remainingHeight > 0) {
        if (pageNum > 0) {
          pdf.addPage()
        }

        // Hitung porsi canvas yang akan ditampilkan di halaman ini
        const sliceHeight = Math.min(availableHeight, remainingHeight)

        // Gunakan canvas clipping untuk multi-page
        const sourceY = (position / ratio)
        const sourceHeight = (sliceHeight / ratio)

        // Buat canvas sementara untuk potongan ini
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgWidth
        pageCanvas.height = sourceHeight

        const ctx = pageCanvas.getContext('2d')
        ctx.drawImage(
          canvas,
          0, sourceY, imgWidth, sourceHeight,  // Source rect
          0, 0, imgWidth, sourceHeight           // Dest rect
        )

        const pageImgData = pageCanvas.toDataURL('image/png')
        pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, sliceHeight)

        position += sliceHeight
        remainingHeight -= sliceHeight
        pageNum++
      }
    }

    // Generate nama file dengan tanggal
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0] // YYYY-MM-DD
    const fullFilename = `${filename}-${dateStr}.pdf`

    // Download PDF
    pdf.save(fullFilename)

    return fullFilename
  } catch (error) {
    console.error('[exportToPDF Error]', error)
    throw new Error('Gagal membuat PDF. Coba lagi dalam beberapa saat.')
  }
}
