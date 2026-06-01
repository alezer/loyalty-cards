// QR string wire format:
//   Stamp:  stamp:{customerId}
//   Reward: reward:{rewardCode}

export function generateStampQR(customerId: string): string {
  return `stamp:${customerId}`
}

export function generateRewardQR(rewardCode: string): string {
  return `reward:${rewardCode}`
}

export type ParsedQR =
  | { type: 'stamp'; customerId: string }
  | { type: 'reward'; rewardCode: string }
  | { type: 'invalid' }

export function parseQR(raw: string): ParsedQR {
  const parts = raw.split(':')

  if (parts.length !== 2) return { type: 'invalid' }

  const [type, value] = parts

  if (!value) return { type: 'invalid' }

  if (type === 'stamp') return { type: 'stamp', customerId: value }
  if (type === 'reward') return { type: 'reward', rewardCode: value }

  return { type: 'invalid' }
}
