import {
  InteractionType,
  ApplicationCommandType,
  InteractionResponseType,
} from 'discord-api-types/v10'
import type {
  APIApplicationCommandInteraction,
  APIInteractionResponse,
} from 'discord-api-types/v10'
import { CommandRouterService } from '../../lib/classes/commands/CommandRouterService'
import type { CommandContext, ICommandHandler } from '../../lib/types/discord'

const mockResponse: APIInteractionResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: { content: 'Pong!' },
}

const mockHandler: ICommandHandler = {
  commandName: 'ping',
  execute: jest.fn().mockResolvedValue(mockResponse),
}

const buildChatInputInteraction = (name: string): APIApplicationCommandInteraction =>
  ({
    type: InteractionType.ApplicationCommand,
    data: { type: ApplicationCommandType.ChatInput, name },
  }) as unknown as APIApplicationCommandInteraction

describe('CommandRouterService', () => {
  let router: CommandRouterService

  beforeEach(() => {
    router = new CommandRouterService([mockHandler])
  })

  it('ChatInput 以外のコマンドタイプは null を返すこと', async () => {
    const interaction = {
      type: InteractionType.ApplicationCommand,
      data: { type: ApplicationCommandType.User, name: 'ping' },
    } as unknown as APIApplicationCommandInteraction
    expect(await router.route(interaction)).toBeNull()
  })

  it('登録済みコマンドをハンドラに委譲すること', async () => {
    const interaction = buildChatInputInteraction('ping')
    const result = await router.route(interaction)
    expect(result).toEqual(mockResponse)
    expect(mockHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining<Partial<CommandContext>>({ interaction: expect.anything() }),
    )
  })

  it('未登録コマンドは null を返すこと', async () => {
    const interaction = buildChatInputInteraction('unknown')
    expect(await router.route(interaction)).toBeNull()
  })
})
