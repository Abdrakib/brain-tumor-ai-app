export interface ScanHistoryItem {
  id: string
  originalImage: string
  gradcamImage: string
  prediction: string
  confidence: number
  probs: Record<string, number>
  timestamp: number
}

const STORAGE_KEY = 'brain-mri-recent-scans'
const MAX_SCANS = 5

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function getRecentScans(): ScanHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ScanHistoryItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addScanToHistory(item: Omit<ScanHistoryItem, 'id'>): void {
  const scans = getRecentScans()
  const newScan: ScanHistoryItem = {
    ...item,
    id: generateId(),
  }
  const updated = [newScan, ...scans].slice(0, MAX_SCANS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // QuotaExceeded or other - ignore
  }
}
