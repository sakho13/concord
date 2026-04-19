import type {
  APIApplicationCommandInteraction,
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
} from 'discord-api-types/v10'
import { ApplicationCommandType } from 'discord-api-types/v10'
import type { ICommandHandler } from '../../types/discord'

/**
 * APPLICATION_COMMAND インタラクションをコマンド名でハンドラにルーティングする Service。
 * HTTP 関心事を持たず、ハンドラが未登録の場合は null を返す。
 */
export class CommandRouterService {
  private readonly _handlers: Map<string, ICommandHandler>

  constructor(handlers: ICommandHandler[]) {
    this._handlers = new Map(handlers.map((h) => [h.commandName, h]))
  }

  async route(interaction: APIApplicationCommandInteraction): Promise<APIInteractionResponse | null> {
    if (interaction.data.type !== ApplicationCommandType.ChatInput) {
      return null
    }
    // data.type の discriminant チェック後、APIChatInputApplicationCommandInteraction に絞り込まれる
    const chatInteraction = interaction as APIChatInputApplicationCommandInteraction
    const handler = this._handlers.get(chatInteraction.data.name)
    if (!handler) {
      return null
    }
    return handler.execute({ interaction: chatInteraction })
  }
}
