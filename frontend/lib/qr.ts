// QR string wire format:
//   Stamp:  stamp:{customerId}:{unixMs}
//   Reward: reward:{rewardCode}:{unixMs}
//
// The timestamp lets scanners reject QRs older than QR_EXPIRY_MS,
// preventing screenshot replay attacks. UUIDs use hyphens not colons,
// so splitting by ':' always yields exactly 3 parts.

export const QR_EXPIRY_MS = 2 * 60 * 1000

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
