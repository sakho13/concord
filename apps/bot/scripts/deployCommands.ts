import { ApplicationCommandType } from 'discord-api-types/v10'
import type { CommandDefinition } from '../src/lib/types/discord'
import { DISCORD_CONFIG } from '../src/lib/statics'

const COMMANDS: CommandDefinition[] = [
  {
    name: 'ping',
    description: 'Pong! を返す',
    type: ApplicationCommandType.ChatInput,
  },
]

const deployCommands = async (): Promise<void> => {
  const { APP_ID, BOT_TOKEN, GUILD_ID } = DISCORD_CONFIG

  if (!APP_ID || !BOT_TOKEN) {
    throw new Error('DISCORD_APP_ID と DISCORD_BOT_TOKEN は必須です')
  }

  const isGuildScoped = Boolean(GUILD_ID)
  const url = isGuildScoped
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(COMMANDS),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Discord API エラー ${response.status}: ${text}`)
  }

  const data = (await response.json()) as unknown[]
  const scope = isGuildScoped ? `ギルド ${GUILD_ID}` : 'グローバル'
  console.log(`${data.length} 件のコマンドを${scope}に登録しました`)
}

deployCommands().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
