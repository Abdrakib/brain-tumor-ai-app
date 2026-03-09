/** Map raw API labels to production-ready display labels. */
export function formatPredictionLabel(raw: string): string {
  const lower = raw.toLowerCase().trim()
  if (lower === 'yes') return 'Tumor Detected'
  if (lower === 'no') return 'No Tumor Detected'
  if (lower === 'uncertain') return 'Uncertain'
  return raw
}

/** Map label key for display in probability lists. */
export function formatProbLabel(key: string): string {
  return formatPredictionLabel(key)
}
