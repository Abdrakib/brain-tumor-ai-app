import { useState, useRef, useCallback } from 'react'
import { CompareSlider } from './components/CompareSlider'
import { AIExplanationPanel } from './components/AIExplanationPanel'
import { ExportSection } from './components/ExportSection'
import { RecentScans } from './components/RecentScans'
import { ConfidenceChart } from './components/ConfidenceChart'
import { getRecentScans, addScanToHistory, type ScanHistoryItem } from './utils/scanHistory'
import { formatPredictionLabel, formatProbLabel } from './utils/formatLabel'

interface PredictionResult {
  ok: boolean
  prediction: string
  pred_label: string
  confidence: number
  probs: Record<string, number>
  uncertain: boolean
  message: string
  request_id?: string
  gradcam_overlay_b64: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MIN_IMAGE_SIZE = 128

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return 'Only JPEG and PNG images are accepted.'
  }
  if (file.size === 0) return 'File is empty.'
  return null
}

function validateImageDimensions(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      if (img.naturalWidth < MIN_IMAGE_SIZE || img.naturalHeight < MIN_IMAGE_SIZE) {
        resolve(`Image must be at least ${MIN_IMAGE_SIZE}x${MIN_IMAGE_SIZE} pixels.`)
      } else {
        resolve(null)
      }
    }
    img.onerror = () => resolve('Could not load image.')
    img.src = src
  })
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-ml-portfolio-2pio.onrender.com'

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>(() => getRecentScans())
  const [resultsKey, setResultsKey] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setError(null)
    setResult(null)
    if (f) {
      const fileErr = validateFile(f)
      if (fileErr) {
        setError(fileErr)
        return
      }
      setFile(f)
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        setPreview(dataUrl)
        const dimErr = await validateImageDimensions(dataUrl)
        if (dimErr) setError(dimErr)
      }
      reader.readAsDataURL(f)
    } else {
      setFile(null)
      setPreview(null)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!file) return
    if (preview) {
      const dimErr = await validateImageDimensions(preview)
      if (dimErr) {
        setError(dimErr)
        return
      }
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
        cache: 'no-store',
      })
      const contentType = res.headers.get('content-type') ?? ''
      if (!res.ok) {
        if (contentType.includes('application/json')) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || `Request failed: ${res.status}`)
        }
        throw new Error(`Request failed: ${res.status}`)
      }
      const data = await res.json() as PredictionResult
      setResult({
        ...data,
        ok: data.ok ?? true,
        prediction: data.prediction ?? formatPredictionLabel(data.pred_label),
        uncertain: data.uncertain ?? false,
        message: data.message ?? '',
      })
      if (preview) {
        addScanToHistory({
          originalImage: preview,
          gradcamImage: data.gradcam_overlay_b64,
          prediction: data.pred_label ?? data.prediction,
          confidence: data.confidence,
          probs: data.probs,
          timestamp: Date.now(),
        })
        setRecentScans(getRecentScans())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [file, preview])

  const handleReset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleLoadFromHistory = useCallback((scan: ScanHistoryItem) => {
    setPreview(scan.originalImage)
    const isUncertain = scan.prediction?.toLowerCase() === 'uncertain'
    setResult({
      ok: true,
      prediction: formatPredictionLabel(scan.prediction),
      pred_label: scan.prediction,
      confidence: scan.confidence,
      probs: scan.probs,
      uncertain: isUncertain,
      message: isUncertain ? 'Low confidence. Consider clinical review or additional imaging.' : '',
      gradcam_overlay_b64: scan.gradcamImage,
    })
    setFile(null)
    setError(null)
    setResultsKey((k) => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 opacity-30"
        style={{
          background: `linear-gradient(-45deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #1a1a2e 100%)`,
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }}
      />

      {/* Floating gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-fuchsia-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-float" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:py-20">
        {/* Hero - Centered */}
        <header className="text-center mb-12 sm:mb-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-2xl shadow-violet-500/30 mb-6 animate-pulse-glow transition-all duration-300 hover:scale-105 ring-4 ring-violet-500/20">
            <svg className="w-12 h-12 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 1-4 4 4 4 0 0 0-2 7v1a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-1a4 4 0 0 0-2-7 4 4 0 0 1-4-4V6a4 4 0 0 0-4-4Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14c.5.5 1.2.9 2 1 .8-.1 1.5-.5 2-1" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent mb-3 transition-all duration-300">
            Brain MRI AI
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-md mx-auto">
            AI-powered tumor classification with explainable Grad-CAM visualization
          </p>
        </header>

        {/* Upload card - Glassmorphism */}
        <section className="w-full max-w-xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 transition-all duration-300 hover:border-white/20 hover:shadow-violet-500/5 relative">
            {loading && (
              <div className="absolute inset-0 rounded-3xl bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="animate-spin h-10 w-10 text-violet-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-slate-300 font-medium">Analyzing image...</span>
                </div>
              </div>
            )}
            <div className="space-y-6">
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                  loading
                    ? 'border-slate-600/50 cursor-not-allowed opacity-60 pointer-events-none'
                    : 'border-slate-500/50 cursor-pointer hover:border-violet-500/50 hover:bg-white/5'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="hidden"
                />
                {preview ? (
                  <div className="space-y-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-xl object-contain"
                    />
                    <p className="text-slate-400 text-sm">{file?.name}</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                      </svg>
                    </div>
                    <p className="text-slate-400">Click or drag to upload MRI scan</p>
                    <p className="text-slate-500 text-sm mt-1">JPEG, PNG only · min 128×128 px</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <span className="text-slate-500 text-xs">Demo:</span>
                      {['demo1', 'demo2', 'demo3'].map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={async () => {
                            setError(null)
                            setResult(null)
                            let res = await fetch(`/demo/${name}.jpg`, { cache: 'no-store' })
                            if (!res.ok) res = await fetch(`/demo/${name}.png`, { cache: 'no-store' })
                            try {
                              if (!res.ok) throw new Error('Demo image not found')
                              const blob = await res.blob()
                              const ext = res.url.endsWith('.png') ? 'png' : 'jpg'
                              const file = new File([blob], `${name}.${ext}`, { type: blob.type })
                              setFile(file)
                              const dataUrl = await new Promise<string>((resolve, reject) => {
                                const r = new FileReader()
                                r.onload = () => resolve(r.result as string)
                                r.onerror = reject
                                r.readAsDataURL(blob)
                              })
                              setPreview(dataUrl)
                            } catch {
                              setError('Demo image unavailable. Add demo1.jpg, demo2.jpg, or demo3.jpg to /public/demo/')
                            }
                          }}
                          disabled={loading}
                          className="rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 disabled:opacity-50"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={!file || loading}
                  className="flex-1 py-4 px-6 rounded-2xl font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze'
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={loading}
                  className="py-4 px-6 rounded-2xl font-semibold border border-slate-600/50 bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Reset
                </button>
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Scans - when no result but we have history */}
        {!result && recentScans.length > 0 && (
          <section className="w-full max-w-xl mt-12 animate-fade-in">
            <RecentScans scans={recentScans} onSelectScan={handleLoadFromHistory} />
          </section>
        )}

        {/* Results - Fade in */}
        {result && (
          <section className="w-full max-w-2xl mt-12 space-y-8 animate-fade-in" key={resultsKey}>
            {/* Compare slider - main hero visual (when we have both original and overlay) */}
            {preview && result.gradcam_overlay_b64 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-4 sm:p-6 transition-all duration-500">
                <h2 className="text-lg font-semibold text-slate-300 mb-4">Compare: Original vs Grad-CAM</h2>
                <CompareSlider
                  originalSrc={preview}
                  overlaySrc={`data:image/png;base64,${result.gradcam_overlay_b64}`}
                />
              </div>
            )}

            {/* Results card */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 space-y-8 transition-all duration-500">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-slate-300">Results</h2>
                {result.request_id && (
                  <span className="text-xs font-mono text-slate-500">#{result.request_id}</span>
                )}
              </div>

              {/* Prediction badge */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-slate-500">Prediction:</span>
                <span
                  className={`inline-flex items-center px-5 py-2.5 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 ${
                    result.uncertain
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400'
                      : result.pred_label?.toLowerCase() === 'yes'
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {result.prediction ?? formatPredictionLabel(result.pred_label)}
                </span>
              </div>
              {result.uncertain && result.message && (
                <p className="text-amber-400/90 text-sm">{result.message}</p>
              )}

              {/* Confidence progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Confidence</span>
                  <span className="font-medium text-white">{(result.confidence * 100).toFixed(2)}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Class probabilities with animated bars */}
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(result.probs).map(([label, prob]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 transition-all duration-300 hover:border-slate-600"
                  >
                    <span className="text-slate-400 text-sm block mb-2">{formatProbLabel(label)}</span>
                    <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                        style={{ width: `${prob * 100}%` }}
                      />
                    </div>
                    <p className="text-lg font-semibold mt-1">{(prob * 100).toFixed(2)}%</p>
                  </div>
                ))}
              </div>

            </div>

            {/* Confidence Chart */}
            <ConfidenceChart probs={result.probs} predLabel={result.pred_label} />

            {/* AI Analysis Summary */}
            <AIExplanationPanel
              predLabel={result.pred_label}
              confidence={result.confidence}
              uncertain={result.uncertain}
            />

            {/* Export */}
            <ExportSection
              predLabel={result.pred_label}
              confidence={result.confidence}
              probs={result.probs}
              originalImageSrc={preview}
              gradcamOverlayB64={result.gradcam_overlay_b64}
              interpretation={result.uncertain ? result.message : result.pred_label?.toLowerCase() === 'yes' ? 'Model detected tumor-related visual patterns.' : 'No tumor-specific patterns detected.'}
              riskLevel={result.uncertain ? 'Low' : result.confidence > 0.8 ? 'High' : result.confidence >= 0.6 ? 'Medium' : 'Low'}
              requestId={result.request_id}
            />

            {/* Recent Scans */}
            <RecentScans scans={recentScans} onSelectScan={handleLoadFromHistory} />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
