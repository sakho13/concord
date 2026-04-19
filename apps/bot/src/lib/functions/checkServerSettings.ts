import { DISCORD_CONFIG } from '../statics'

export function checkServerSettings() {
  if (DISCORD_CONFIG.APP_ID === undefined) {
    throw new Error('Discord APP_ID が未設定')
  }

  if (DISCORD_CONFIG.PUBLIC_KEY === undefined) {
    throw new Error('Discord PUBLIC_KEY が未設定')
  }

  if (DISCORD_CONFIG.BOT_TOKEN === undefined) {
    throw new Error('Discord BOT_TOKEN が未設定')
  }

  if (DISCORD_CONFIG.GUILD_ID === undefined) {
    throw new Error('Discord GUILD_ID が未設定')
  }

  return true
}
