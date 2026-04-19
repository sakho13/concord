import type { APIInteractionResponse } from 'discord-api-types/v10'
import { InteractionResponseType } from 'discord-api-types/v10'
import type { CommandContext, ICommandHandler } from '../../types/discord'

/** /ping コマンドハンドラ。"Pong!" を返す。 */
export class PingHandler implements ICommandHandler {
  readonly commandName = 'ping'

  async execute(_ctx: CommandContext): Promise<APIInteractionResponse> {
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: 'Pong!' },
    }
  }
}
