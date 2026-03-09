import { useState, useCallback, useEffect } from 'react'

interface CompareSliderProps {
  originalSrc: string
  overlaySrc: string
}

export function CompareSlider({ originalSrc, overlaySrc }: CompareSliderProps) {
  const [swapped, setSwapped] = useState(false)
  const [heatmapIntensity, setHeatmapIntensity] = useState(80)
  const [modalImage, setModalImage] = useState<string | null>(null)

  const leftSrc = swapped ? overlaySrc : originalSrc
  const rightSrc = swapped ? originalSrc : overlaySrc
  const leftLabel = swapped ? 'Grad-CAM' : 'Original'
  const rightLabel = swapped ? 'Original' : 'Grad-CAM'
  const leftIsGradcam = swapped
  const rightIsGradcam = !swapped

  const handleSwap = useCallback(() => {
    setSwapped((s) => !s)
  }, [])

  const handleDownload = useCallback(() => {
    const parts = overlaySrc.split(',')
    if (parts[1]) {
      const binary = atob(parts[1])
      const arr = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
      const blob = new Blob([arr], { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'gradcam-overlay.png'
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [overlaySrc])

  const openModal = useCallback((src: string) => {
    setModalImage(src)
  }, [])

  const closeModal = useCallback(() => {
    setModalImage(null)
  }, [])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    if (modalImage) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [modalImage, closeModal])

  const gradcamOpacity = heatmapIntensity / 100

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/50 shadow-xl shadow-black/20">
      <div className="flex flex-col sm:flex-row aspect-[4/3] sm:aspect-video">
        {/* Left column / Top on mobile */}
        <button
          type="button"
          onClick={() => openModal(leftSrc)}
          className="relative flex-1 min-h-0 overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-inset"
        >
          <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900/80 backdrop-blur-sm border border-slate-600/50 text-slate-300">
            {leftLabel}
          </span>
          <img
            src={leftSrc}
            alt={leftLabel}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={leftIsGradcam ? { opacity: gradcamOpacity } : {}}
            draggable={false}
          />
        </button>

        {/* Vertical divider (desktop) / Horizontal divider (mobile) */}
        <div className="hidden sm:block w-px bg-slate-600/60 shrink-0" aria-hidden />
        <div className="sm:hidden h-px bg-slate-600/60 shrink-0" aria-hidden />

        {/* Right column / Bottom on mobile */}
        <button
          type="button"
          onClick={() => openModal(rightSrc)}
          className="relative flex-1 min-h-0 overflow-hidden cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-inset"
        >
          <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-900/60 backdrop-blur-sm border border-violet-500/40 text-violet-200">
            {rightLabel}
          </span>
          <img
            src={rightSrc}
            alt={rightLabel}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
            style={rightIsGradcam ? { opacity: gradcamOpacity } : {}}
            draggable={false}
          />
        </button>
      </div>

      {/* Color legend - under Grad-CAM (right column on desktop, bottom on mobile) */}
      <div className="px-4 pb-3 pt-1">
        <p className="text-xs text-slate-400 mb-1.5">Grad-CAM Attention</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 shrink-0">Low</span>
          <div
            className="flex-1 h-2 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(to right, #1e3a5f, #0d9488, #facc15, #dc2626)',
            }}
          />
          <span className="text-xs text-slate-500 shrink-0">High</span>
        </div>
      </div>

      {/* Heatmap intensity slider */}
      <div className="px-4 pb-4 pt-0">
        <label className="block text-xs text-slate-400 mb-2">
          Heatmap Intensity: {heatmapIntensity}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={heatmapIntensity}
          onChange={(e) => setHeatmapIntensity(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-violet-500"
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 p-4 border-t border-slate-700/50 bg-slate-900/30">
        <button
          onClick={handleSwap}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Swap
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-violet-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Grad-CAM
        </button>
      </div>

      {/* Click-to-zoom modal */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeInOverlay_0.2s_ease-out]"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Image zoom"
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-[zoomIn_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 p-2 rounded-xl text-slate-400 hover:text-white bg-black/50 hover:bg-black/70 transition-colors z-10"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={modalImage}
              alt="Zoomed view"
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  )
}
