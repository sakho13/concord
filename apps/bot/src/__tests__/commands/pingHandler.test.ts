import type { APIInteractionResponseChannelMessageWithSource } from 'discord-api-types/v10'
import { InteractionResponseType } from 'discord-api-types/v10'
import { PingHandler } from '../../lib/commands/ping/pingHandler'
import type { CommandContext } from '../../lib/types/discord'

describe('PingHandler', () => {
  const handler = new PingHandler()

  it('commandName が "ping" であること', () => {
    expect(handler.commandName).toBe('ping')
  })

  it('ChannelMessageWithSource で "Pong!" を返すこと', async () => {
    const response = await handler.execute({} as unknown as CommandContext)
    expect(response.type).toBe(InteractionResponseType.ChannelMessageWithSource)
    expect((response as APIInteractionResponseChannelMessageWithSource).data).toMatchObject({ content: 'Pong!' })
  })
})
