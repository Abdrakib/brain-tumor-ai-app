import { useCallback } from 'react'
import type { ScanHistoryItem } from '../utils/scanHistory'
import { formatPredictionLabel } from '../utils/formatLabel'

interface RecentScansProps {
  scans: ScanHistoryItem[]
  onSelectScan: (scan: ScanHistoryItem) => void
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  if (diffMs < 60000) return 'Just now'
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`
  return d.toLocaleDateString()
}

export function RecentScans({ scans, onSelectScan }: RecentScansProps) {
  const handleClick = useCallback(
    (scan: ScanHistoryItem) => {
      onSelectScan(scan)
    },
    [onSelectScan]
  )

  if (scans.length === 0) return null

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 transition-all duration-500">
      <h2 className="text-xl font-semibold text-slate-300 mb-6">Recent Scans</h2>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {scans.map((scan) => (
          <button
            key={scan.id}
            type="button"
            onClick={() => handleClick(scan)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/40 hover:border-slate-600/80 transition-all duration-300 text-left group"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50">
              <img
                src={scan.originalImage}
                alt="Scan"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex px-3 py-1 rounded-lg text-xs font-medium ${
                    scan.prediction.toLowerCase() === 'yes'
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                      : scan.prediction.toLowerCase() === 'uncertain'
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  {formatPredictionLabel(scan.prediction)}
                </span>
                <span className="text-sm font-medium text-white">
                  {(scan.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-slate-500">{formatTime(scan.timestamp)}</p>
            </div>

            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-violet-400 transition-colors flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}
