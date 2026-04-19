# Discord Bot アーキテクチャ

## 概要

`apps/bot` は Hono ベースの HTTP サーバーとして動作する Discord Bot。
WebSocket Gateway（discord.js）ではなく **HTTP Interactions** を採用している。

## なぜ HTTP Interactions か

| 方式 | 採用 | 理由 |
|---|---|---|
| HTTP Interactions | ✅ | ステートレス・署名検証のみ・Hono と相性が良い |
| discord.js (Gateway) | ❌ | WebSocket 常時接続が必要で Hono と共存不可 |
| `@discordjs/rest` | ❌ | Node.js 標準 `fetch` で代替できるため不要 |

将来的にメッセージ監視・リアクション等が必要になれば、discord.js Gateway ボットを**別サービス**として追加する。

## リクエストフロー

```
POST /api/v1/interactions
  └─ Ed25519 署名検証 (discord-verify.ts)
       ├─ type === 1 (Ping)         → { type: 1 } (Pong)
       ├─ type === 2 (ApplicationCommand)
       │    └─ CommandRouterService.route()
       │         └─ Map.get(commandName)
       │              └─ ICommandHandler.execute(ctx)
       │                   └─ APIInteractionResponse
       └─ それ以外                  → 400
```

## ファイル構成

```
apps/bot/
├── scripts/
│   └── deployCommands.ts          # Discord API へのコマンド登録 (PUT bulk overwrite)
├── src/
│   ├── index.ts                   # Hono サーバー (port 3002)
│   ├── api/v1/
│   │   └── v1Api.ts               # POST /interactions エンドポイント
│   └── lib/
│       ├── types/
│       │   └── discord.ts         # CommandContext / ICommandHandler / CommandDefinition
│       ├── classes/commands/
│       │   └── CommandRouterService.ts   # DDD Service: コマンドルーター
│       ├── commands/
│       │   └── ping/
│       │       └── pingHandler.ts        # /ping 実装
│       ├── functions/
│       │   ├── discord-verify.ts         # Ed25519 署名検証
│       │   └── checkServerSettings.ts   # 起動時の環境変数チェック
│       └── statics.ts             # DISCORD_CONFIG 定数
├── jest.config.cjs
└── tsconfig.jest.json
```

## 型定義

```typescript
// src/lib/types/discord.ts

type CommandContext = {
  readonly interaction: APIChatInputApplicationCommandInteraction
}

interface ICommandHandler {
  readonly commandName: string
  execute(ctx: CommandContext): Promise<APIInteractionResponse>
}

type CommandDefinition = RESTPostAPIApplicationCommandsJSONBody
```

## コマンドの追加方法

### 1. ハンドラを実装する

```typescript
// src/lib/commands/hello/helloHandler.ts
import { InteractionResponseType } from 'discord-api-types/v10'
import type { ICommandHandler, CommandContext } from '../../types/discord'

export class HelloHandler implements ICommandHandler {
  readonly commandName = 'hello'

  async execute(ctx: CommandContext) {
    const username = ctx.interaction.member?.user.username ?? 'World'
    return {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: { content: `Hello, ${username}!` },
    }
  }
}
```

### 2. ルーターに登録する

```typescript
// src/api/v1/v1Api.ts
const commandRouter = new CommandRouterService([
  new PingHandler(),
  new HelloHandler(), // 追加
])
```

### 3. デプロイスクリプトに追加する

```typescript
// scripts/deployCommands.ts
const COMMANDS: CommandDefinition[] = [
  { name: 'ping', description: 'Pong! を返す', type: ApplicationCommandType.ChatInput },
  { name: 'hello', description: '挨拶する', type: ApplicationCommandType.ChatInput }, // 追加
]
```

### 4. テストを書く

```typescript
// src/__tests__/commands/helloHandler.test.ts
import { HelloHandler } from '../../lib/commands/hello/helloHandler'

describe('HelloHandler', () => {
  it('commandName が "hello" であること', () => {
    expect(new HelloHandler().commandName).toBe('hello')
  })
})
```

## 開発フロー

### ローカル開発

```bash
# 依存インストール
pnpm install

# 型チェック
pnpm --filter @app/bot check-types

# テスト
pnpm --filter @app/bot test

# 開発サーバー起動 (port 3002)
pnpm dev
```

### コマンド登録

`.env` に Discord 認証情報を設定した上で実行:

```bash
pnpm deploy-commands
```

- `DISCORD_GUILD_ID` が設定されている場合 → ギルドコマンド（即時反映）
- 未設定の場合 → グローバルコマンド（反映に最大 1 時間）

### Discord への接続確認

1. `pnpm dev` でサーバーを起動
2. ngrok 等で port 3002 を公開
3. Discord Developer Portal → アプリ → **Interactions Endpoint URL** に設定
4. Discord でスラッシュコマンドを実行して動作確認

## 環境変数

| 変数名 | 必須 | 説明 |
|---|---|---|
| `DISCORD_APP_ID` | ✅ | アプリケーション ID |
| `DISCORD_PUBLIC_KEY` | ✅ | 署名検証用公開鍵 |
| `DISCORD_BOT_TOKEN` | ✅ | Bot トークン（コマンド登録時のみ使用） |
| `DISCORD_GUILD_ID` | ⬜ | 設定するとギルドコマンドとして登録 |

## テスト構成

Jest + ts-jest で実行。`tsconfig.jest.json` が `module: CommonJS` にオーバーライドする。

```bash
pnpm --filter @app/bot test
```

テストファイルは `src/__tests__/` 配下に配置する。
