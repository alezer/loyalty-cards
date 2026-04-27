// QR string wire format:
//   Stamp:  stamp:{customerId}:{unixMs}
//   Reward: reward:{rewardCode}:{unixMs}
//
// Both carry a millisecond timestamp so scanners can reject QRs older than
// QR_EXPIRY_MS (default 5 minutes), preventing screenshot replay attacks.

export const QR_EXPIRY_MS = 5 * 60 * 1000

export function generateStampQR(customerId: string): string {
  return `stamp:${customerId}:${Date.now()}`
}

export function generateRewardQR(rewardCode: string): string {
  return `reward:${rewardCode}:${Date.now()}`
}

export type ParsedQR =
  | { type: 'stamp'; customerId: string; timestamp: number }
  | { type: 'reward'; rewardCode: string; timestamp: number }
  | { type: 'invalid' }

export function parseQR(raw: string): ParsedQR {
  const parts = raw.split(':')

  // UUIDs already contain hyphens but no colons, so splitting by ':' gives
  // exactly 3 parts for both stamp and reward formats.
  if (parts.length !== 3) return { type: 'invalid' }

  const [type, value, tsStr] = parts
  const timestamp = parseInt(tsStr, 10)

  if (isNaN(timestamp) || !value) return { type: 'invalid' }

  if (type === 'stamp') return { type: 'stamp', customerId: value, timestamp }
  if (type === 'reward') return { type: 'reward', rewardCode: value, timestamp }

  return { type: 'invalid' }
}

export function isQRExpired(timestamp: number): boolean {
  return Date.now() - timestamp > QR_EXPIRY_MS
}

/** Formats remaining seconds as MM:SS */
export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
