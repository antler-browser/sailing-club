const PALETTE = [
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F97316', // orange
  '#10B981', // emerald
  '#06B6D4', // cyan
  '#EF4444', // red
  '#84CC16', // lime
  '#F59E0B', // amber
  '#6366F1', // indigo
]

export function getMemberColor(did: string, isSelf: boolean): string {
  if (isSelf) return '#C4973B' // brass/gold for self
  let hash = 0
  for (let i = 0; i < did.length; i++) {
    hash = (hash * 31 + did.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
