import type {
  APIChatInputApplicationCommandInteraction,
  APIInteractionResponse,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord-api-types/v10'

export type CommandContext = {
  readonly interaction: APIChatInputApplicationCommandInteraction
}

/** 各スラッシュコマンドハンドラが実装するインターフェース */
export interface ICommandHandler {
  readonly commandName: string
  execute(ctx: CommandContext): Promise<APIInteractionResponse>
}

export type CommandDefinition = RESTPostAPIApplicationCommandsJSONBody
