import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { router } from './routes'

const app = new Hono()

// ── Middleware ────────────────────────────────────────────────────
app.use('*', logger())

app.use(
  '*',
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowMethods:  ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders:  ['Content-Type', 'Authorization'],
  }),
)

// ── Routes ────────────────────────────────────────────────────────
app.route('/api/v1', router)

app.get('/health', (c) =>
  c.json({ status: 'ok', service: 'loyalty-cards-api', timestamp: new Date().toISOString() }),
)

app.notFound((c) => c.json({ error: 'Route not found' }, 404))

app.onError((err, c) => {
  console.error('[ERROR]', err)
  return c.json({ error: 'Internal server error' }, 500)
})

// ── Start ─────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '4000', 10)

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Backend running → http://localhost:${info.port}`)
  console.log(`Health check  → http://localhost:${info.port}/health`)
})

export default app
