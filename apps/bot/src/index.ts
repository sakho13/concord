import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import ApiV1 from './api/v1/v1Api'
import { logger } from 'hono/logger'
import { checkServerSettings } from './lib/functions/checkServerSettings'

const version = process.env.APP_VERSION || 'dev'
const port = Number(process.env.PORT ?? 3002)

const app = new Hono()

app.use('*', logger())
app.use('*', async (c, next) => {
  await next()
  c.header('X-API-Version', version)
})

app.route('/api/v1', ApiV1)

app.get('/health', async (c) => {
  return c.json({
    status: 'success',
    message: 'API is healthy',
    data: {
      version,
    },
  })
})

app.onError((err, c) => {
  console.error(err)

  if (err instanceof Error) {
    return c.json(
      {
        status: 'error',
        message: 'error',
        data: {
          nm: err.name,
          msg: err.message,
        },
      },
      500
    )
  }

  return c.json(
    {
      status: 'error',
      message: 'unknown error',
      data: {},
    },
    500
  )
})

serve({ fetch: app.fetch, port }, (info) => {
  checkServerSettings()

  console.log(`Bot server running at http://localhost:${info.port}`)
})
