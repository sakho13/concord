import { Hono } from 'hono'
import type { APIInteraction } from 'discord-api-types/v10'
import { InteractionType, InteractionResponseType } from 'discord-api-types/v10'
import { verifyDiscordRequest } from '../../lib/functions/discord-verify'
import { DISCORD_CONFIG } from '../../lib/statics'
import { CommandRouterService } from '../../lib/classes/commands/CommandRouterService'
import { PingHandler } from '../../lib/commands/ping/pingHandler'

const commandRouter = new CommandRouterService([new PingHandler()])

const ApiV1 = new Hono()

ApiV1.post('/interactions', async (c) => {
  const signature = c.req.header('x-signature-ed25519')
  const timestamp = c.req.header('x-signature-timestamp')
  const rawBody = await c.req.text()

  if (!signature || !timestamp) {
    return c.json({ error: 'Missing signature headers' }, 401)
  }

  const publicKey = DISCORD_CONFIG.PUBLIC_KEY
  if (!publicKey) {
    throw new Error('DISCORD_PUBLIC_KEY is not set')
  }

  const isValid = verifyDiscordRequest(publicKey, signature, timestamp, rawBody)
  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  // 署名検証済みのペイロードを Discord 型に変換する境界キャスト
  const interaction = JSON.parse(rawBody) as APIInteraction

  if (interaction.type === InteractionType.Ping) {
    return c.json({ type: InteractionResponseType.Pong })
  }

  if (interaction.type === InteractionType.ApplicationCommand) {
    const response = await commandRouter.route(interaction)
    if (!response) {
      return c.json({ error: 'Unknown command' }, 400)
    }
    return c.json(response)
  }

  return c.json({ error: 'Unknown interaction type' }, 400)
})

export default ApiV1
