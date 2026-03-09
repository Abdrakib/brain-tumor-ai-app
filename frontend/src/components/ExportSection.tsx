import { useState, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import { formatPredictionLabel, formatProbLabel } from '../utils/formatLabel'

interface ExportSectionProps {
  predLabel: string
  confidence: number
  probs: Record<string, number>
  originalImageSrc: string | null
  gradcamOverlayB64: string | null
  interpretation: string
  riskLevel: string
  requestId?: string
}

export function ExportSection({
  predLabel,
  confidence,
  probs,
  originalImageSrc,
  gradcamOverlayB64,
  interpretation,
  riskLevel,
  requestId,
}: ExportSectionProps) {
  const [toast, setToast] = useState<'none' | 'copied' | 'downloaded'>('none')

  const showToast = useCallback((type: 'copied' | 'downloaded') => {
    setToast(type)
    setTimeout(() => setToast('none'), 2500)
  }, [])

  const handleCopyLink = useCallback(async () => {
    const formattedProbs = Object.fromEntries(
      Object.entries(probs).map(([k, v]) => [formatProbLabel(k), Math.round(v * 10000) / 10000])
    )
    const summary = {
      prediction: formatPredictionLabel(predLabel),
      confidence: Math.round(confidence * 10000) / 10000,
      riskLevel,
      probabilities: formattedProbs,
      interpretation,
      generatedAt: new Date().toISOString(),
    }
    try {
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2))
      showToast('copied')
    } catch {
      setToast('none')
    }
  }, [predLabel, confidence, riskLevel, probs, interpretation, showToast])

  const handleDownloadPdf = useCallback(async () => {
    const doc = new jsPDF()
    const pageW = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    doc.setFontSize(18)
    doc.text('Brain MRI AI — Clinical Report', margin, y)
    y += 12

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated: ${new Date().toLocaleString()}${requestId ? ` · #${requestId}` : ''}`, margin, y)
    y += 16

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text(`Prediction: ${formatPredictionLabel(predLabel)}`, margin, y)
    y += 8
    doc.text(`Confidence: ${(confidence * 100).toFixed(2)}%`, margin, y)
    y += 8
    doc.text(`Risk Level: ${riskLevel}`, margin, y)
    y += 16

    const imgW = 60
    const imgH = 60
    const gap = 15
    let imgX = margin

    if (originalImageSrc) {
      try {
        const base64 = originalImageSrc.split(',')[1] || originalImageSrc
        const fmt = originalImageSrc.includes('png') ? 'PNG' : 'JPEG'
        doc.addImage(base64, fmt, imgX, y, imgW, imgH)
        doc.setFontSize(9)
        doc.text('Original MRI', imgX, y + imgH + 6)
        imgX += imgW + gap
      } catch {
        doc.text('[Original image unavailable]', imgX, y + imgH / 2)
        imgX += imgW + gap
      }
    }

    if (gradcamOverlayB64) {
      try {
        doc.addImage(gradcamOverlayB64, 'PNG', imgX, y, imgW, imgH)
        doc.setFontSize(9)
        doc.text('Grad-CAM Overlay', imgX, y + imgH + 6)
      } catch {
        doc.text('[Grad-CAM unavailable]', imgX, y + imgH / 2)
      }
    }

    y += imgH + 20

    doc.setFontSize(11)
    doc.text('Interpretation', margin, y)
    y += 8

    doc.setFontSize(10)
    const lines = doc.splitTextToSize(interpretation, pageW - 2 * margin)
    doc.text(lines, margin, y)
    y += lines.length * 6 + 4

    doc.setFontSize(9)
    const bulletLines = [
      '• Attention focused on highlighted regions in the visualization.',
      '• Grad-CAM shows model decision areas used for classification.',
    ]
    bulletLines.forEach((line) => {
      doc.text(line, margin, y)
      y += 6
    })

    y += 12
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Disclaimer: AI-assisted, not a medical diagnosis.', margin, y)

    doc.save(`brain-mri-report-${new Date().toISOString().slice(0, 10)}.pdf`)
    showToast('downloaded')
  }, [predLabel, confidence, riskLevel, originalImageSrc, gradcamOverlayB64, interpretation, requestId, showToast])

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 transition-all duration-500">
      <h2 className="text-xl font-semibold text-slate-300 mb-6">Export</h2>

      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Report (PDF)
        </button>

        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Copy Share Link
        </button>
      </div>

      {/* Toast */}
      {toast !== 'none' && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-medium shadow-lg animate-[fadeIn_0.2s_ease-out] flex items-center gap-2"
          role="status"
        >
          {toast === 'copied' && (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied to clipboard
            </>
          )}
          {toast === 'downloaded' && (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Report downloaded
            </>
          )}
        </div>
      )}
    </div>
  )
}
