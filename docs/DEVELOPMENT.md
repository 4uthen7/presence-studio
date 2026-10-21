# Development notes

Presence Studio の内部構成・Discord 連携・ビルド方法に関する技術メモです。
一般ユーザー向けの使い方は [README](../README.md) を参照してください。

## 構成

```
src/
  main/                 Electron メインプロセス
    rpc.ts              Discord IPC クライアント（生プロトコル）
    store.ts            JSON / DPAPI / ファイルダイアログ
    index.ts            ウィンドウ・トレイ・IPC・自動起動
  preload/              contextBridge API
  renderer/             React + TypeScript + Vite
    views/              Studio / Widgets / Presets / Profiles / Library / Settings
    components/         UI・プレビュー・モーダル
    lib/                presence builder / widget payload / presets / art / templates
    store/              Zustand ストア
  shared/               メインとレンダラー共通の型
resources/              アイコン
screenshots/            README 用スクリーンショット
scripts/serve.cjs       ブラウザプレビュー用の静的サーバー
```

## 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| デスクトップ | Electron 45 |
| UI | React 19 + TypeScript + Vite 7 |
| 状態管理 | Zustand |
| ドラッグ＆ドロップ | dnd-kit |
| アイコン | lucide-react |
| Discord RPC | 独自実装（`net` + Discord IPC） |
| Widgets v2 | Discord REST API v9 |

## Discord RPC

Discord デスクトップクライアントの名前付きパイプ
`\\.\pipe\discord-ipc-0` ～ `discord-ipc-9` を探索して接続します。

1. HANDSHAKE (`opcode 0`)
   ```json
   { "v": 1, "client_id": "123456789012345678" }
   ```
2. READY を受信してユーザー情報を取得
3. SET_ACTIVITY (`opcode 1`)
   ```json
   {
     "cmd": "SET_ACTIVITY",
     "args": { "pid": 1234, "activity": { "...": "..." } },
     "nonce": "uuid"
   }
   ```
4. 終了時は `activity: null` を送信

UI 側は編集しやすいフラットな Activity を持ち、送信時に Discord の
ネストした RPC Activity 形式へ変換します（`src/main/rpc.ts` の `toWireActivity`）。

```json
{
  "type": 2,
  "details": "Neon District — Chapter 04",
  "state": "Rain on the windshield · 88.1 FM",
  "timestamps": { "start": 1700000000000 },
  "assets": {
    "large_image": "night_drive_cover",
    "large_text": "Night Drive OST",
    "small_image": "lossless",
    "small_text": "Lossless"
  },
  "party": { "id": "party-1", "size": [2, 4] },
  "buttons": [{ "label": "Listen along", "url": "https://open.spotify.com" }],
  "status_display_type": 1,
  "instance": false
}
```

### エラー処理

- パイプが見つからない場合は自動再接続（指数バックオフ、最大30秒）
- Discord が `Invalid Client ID` を返した場合は再接続せず、UI に日本語のエラーを表示
- ハンドシェイク・SET_ACTIVITY にはタイムアウトを設定
- アプリ終了時は接続を破棄（Discord 側もアクティビティを解除）

### 制限

Discord RPC の Activity Type は Streaming / Custom / Hang を設定できません。
本アプリは Playing / Listening / Watching / Competing のみ提供します。

## Widgets v2

Widget のレイアウトは Discord Developer Portal の Widget エディタで作成します。
アプリはポータルで定義した Data Field に対して、ユーザーごとの値を送信します。

```http
PATCH https://discord.com/api/v9/applications/{appId}/users/{userId}/identities/0/profile
Authorization: Bot {botToken}
Content-Type: application/json
User-Agent: DiscordBot (https://github.com/4uthen7/presence-studio, 0.2.0)
```

```json
{
  "username": "Aster",
  "metadata": { "source": "last.fm" },
  "data": {
    "dynamic": [
      { "type": 1, "name": "track", "value": "Midnight City" },
      { "type": 2, "name": "scrobbles", "value": 12480 },
      { "type": 3, "name": "cover", "value": { "url": "https://…" } }
    ],
    "primary": {
      "season": "2026",
      "rank_name": "Ascendant II"
    }
  }
}
```

- `type`: `1` = 文字列, `2` = 数値, `3` = 画像URL
- `metadata`: 最大25件
- Dynamic Data Field は Developer Portal 側の Data Field 名と一致させる
- 画像は `https://` URL のみ送信可能。ローカル画像（data URL）は送信しない

### 認証

- OAuth2 スコープ: `openid`, `sdk.social_layer`
- Bot Token はメインプロセスのみで扱い、レンダラーには保存しない
- `safeStorage`（Windows DPAPI）で暗号化して `secrets.json` に保存
- `safeStorage` が利用できない環境では保存しない

## データ

```text
%APPDATA%\Presence Studio\
  presence-studio.json   ワークスペース（ペルソナ / Presence / Widget / 設定）
  secrets.json           DPAPI で暗号化した Bot Token
```

- 保存は 450ms のデバウンス付き
- 書き込みは一時ファイル + rename のアトミック更新
- インポート時は既知のブロック種別だけを残し、古いデータを自動マイグレーション
- エクスポート JSON に Bot Token は含めない

## セキュリティ

- `contextIsolation: true`, `nodeIntegration: false`
- 外部URLは `http(s)` / `discord:` のみ `shell.openExternal` で開く
- CSP で `script-src 'self'`、`img-src` は `self/data/https` に制限
- Bot Token をログ・エクスポート・レンダラー状態に含めない

## ビルド

```powershell
npm install
npm run dev          # 開発
npm run typecheck    # 型チェック
npm run build        # out/ に本番ビルド
npm run package      # ポータブルEXE（NSIS）
npm run package:dir  # 展開済みフォルダ
npm run preview:web  # ブラウザプレビュー
```

### ポータブルEXEについて

Electron Builder の NSIS ポータブル圧縮は環境によって非常に時間がかかります。
その場合は `npm run package:dir` で `release/win-unpacked` を作成し、
フォルダを ZIP にしてください。

### ブラウザプレビュー

Electron なしで UI を確認するためのモードです。
`src/renderer/src/lib/browserMock.ts` が `window.presenceStudio` のモックを提供します。

```powershell
npm run build
npm run preview:web
# http://127.0.0.1:4173/?view=studio
```

クエリパラメータ:

- `?view=studio|widgets|presets|profiles|library|settings`
- `?palette=1` コマンドパレットを開く
- `?publish=1` Publish モーダルを開く
- `?persona=1` ペルソナエディタを開く
- `?preset=valorant` プリセットの詳細モーダルを開く
- `?motion=0` アニメーションを無効化

ブラウザプレビューでは Discord IPC と Widget 公開は動作しません。

## 検証

- `npm run typecheck`（node / web 両方）
- `npm run build`
- Discord IPC: 実機の `discord-ipc-0` へ接続し、READY → SET_ACTIVITY → clear を確認
- 不正な Application ID に対するエラーハンドリングを確認
- UI: ブラウザプレビューで全画面を確認

## プリセット

`src/renderer/src/lib/presets.ts` にゲーム・開発・音楽アプリの
`SimulationPreset` を定義しています。

- `presetToPresence()` が `PresenceConfig`（ブロック、パーティ、タイマー、ボタン）へ変換
- 画像は Discord の Asset Key（`game_icon` など）を指定
- プレビュー用のアートワークとアプリアイコンは `makeArtwork` / `makeAvatar` で生成
- アプリ名は `settings.previewAppName` に反映されるが、実際の Discord 表示は
  Application ID のアプリ情報になる

参考元・制約は [PRESETS.md](PRESETS.md) を参照。

## ライセンス

MIT
