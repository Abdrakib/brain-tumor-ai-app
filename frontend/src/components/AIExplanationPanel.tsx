interface AIExplanationPanelProps {
  predLabel: string
  confidence: number
  uncertain?: boolean
}

function getRiskLevel(confidence: number, uncertain?: boolean): 'High' | 'Medium' | 'Low' {
  if (uncertain) return 'Low'
  if (confidence > 0.8) return 'High'
  if (confidence >= 0.6) return 'Medium'
  return 'Low'
}

function getConfidenceInterpretation(confidence: number, uncertain?: boolean): string {
  if (uncertain) return 'Low confidence — consider clinical review'
  if (confidence > 0.8) return 'High confidence'
  if (confidence >= 0.6) return 'Medium confidence'
  return 'Low confidence'
}

export function AIExplanationPanel({ predLabel, confidence, uncertain }: AIExplanationPanelProps) {
  const isYes = predLabel.toLowerCase() === 'yes'
  const riskLevel = getRiskLevel(confidence, uncertain)
  const confidenceText = getConfidenceInterpretation(confidence, uncertain)

  const mainExplanation = uncertain
    ? 'Low confidence result. Consider clinical review or additional imaging.'
    : isYes
      ? 'Model detected tumor-related visual patterns.'
      : 'No tumor-specific patterns detected.'

  const riskLevelStyles = {
    High: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    Medium: 'bg-violet-500/20 border-violet-500/40 text-violet-400',
    Low: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 sm:p-10 transition-all duration-500 animate-[fadeIn_0.6s_ease-out_0.15s_forwards] opacity-0">
      {/* Header with brain icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 1-4 4 4 4 0 0 0-2 7v1a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-1a4 4 0 0 0-2-7 4 4 0 0 1-4-4V6a4 4 0 0 0-4-4Z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14c.5.5 1.2.9 2 1 .8-.1 1.5-.5 2-1" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-300">AI Analysis Summary</h2>
          <span className={`inline-flex items-center mt-1 px-3 py-1 rounded-lg text-xs font-medium border ${riskLevelStyles[riskLevel]}`}>
            Risk Level: {riskLevel}
          </span>
        </div>
      </div>

      {/* Main explanation */}
      <p className="text-slate-300 mb-5 leading-relaxed">
        {mainExplanation}
      </p>

      {/* Bullet points */}
      <ul className="space-y-3 text-sm text-slate-400">
        <li className="flex items-start gap-2">
          <span className="text-violet-500 mt-0.5">•</span>
          <span>Attention focused on highlighted regions in the visualization.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-violet-500 mt-0.5">•</span>
          <span>Grad-CAM shows model decision areas used for classification.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-violet-500 mt-0.5">•</span>
          <span>Confidence interpretation: {confidenceText} (&gt;80% = High, 60–80% = Medium, &lt;60% = Low)</span>
        </li>
      </ul>
    </div>
  )
}
