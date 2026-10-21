# RPC Presets / Simulation

Presence Studio の **Presets** 機能は、公開されている Discord RPC 実装の
「フィールドの並び」を参考に、ゲーム・開発ツール・音楽アプリの Presence を
ワンクリックで再現するためのファンメイド機能です。

> 各ゲーム・アプリの公式提供ではありません。商標・著作権は各権利者に帰属します。
> なりすましや詐欺的な用途には使用しないでください。

## 使い方

1. **Presets** タブを開く
2. カテゴリまたは検索でプリセットを選ぶ
3. **Presence に適用** または **適用して Go live**
4. 必要に応じて **Application ID** を設定する

## 重要な制約

### アプリ名・アイコンは Application ID 側で決まる

Discord に表示されるアプリ名・アイコンは、接続している Discord Application のものです。
Presence Studio のプレビューではプリセット名を表示しますが、実際の Discord では
Application ID のアプリ名が表示されます。

ゲーム名を表示したい場合は、Developer Portal で同じ名前の Application を作成し、
その Application ID をプリセットの入力欄に指定してください。

### 画像は Asset Key としてアップロードが必要

プリセットの画像は `game_icon` や `rank_ascendant` などの **Asset Key** を指定します。
Developer Portal の **Rich Presence → Art Assets** に同じキー名で画像をアップロードすると
Discord に表示されます。アップロードしない場合、画像は表示されません
（テキスト・パーティ・ボタンは表示されます）。

### 実装の参考元

| プリセット | 参考にした公開実装 |
| --- | --- |
| VALORANT | [matthew-paul/valorant-rpc](https://github.com/matthew-paul/valorant-rpc) の `session.py` / `default.py`（`details = mode // score`、`state = party state`、agent/map/rank の画像、party size） |
| Counter-Strike 2 | [outpoints/CS-RichPresence](https://github.com/outpoints/CS-RichPresence) の `main.py`（map, score, K/D/A, CT/T, party, start time） |
| Visual Studio Code | [x86cherry/vscord](https://github.com/x86cherry/vscord) の既定設定（`In {workspace} - {problems} problems found`、`Working on {file}:{line}:{col}`、language image） |
| osu! | [ppy/osu](https://github.com/ppy/osu) の `DiscordRichPresence.cs`（rank/pp、ruleset の small image、elapsed time） |
| Spotify | Discord/JDA の Rich Presence 実装（`spotify:` image key、Listening type、song/artist/album） |
| その他のゲーム | 公開されている RPC クライアントの一般的なフィールド構成（details/state/party/assets/buttons）を参考にしたシミュレーション |

## プリセット一覧

### Games

- VALORANT — Competitive · Ascendant II · 3/5 party
- League of Legends — Ranked Solo/Duo · Diamond II · 2/5 party
- Counter-Strike 2 — Competitive · Mirage · 3/5 party
- Apex Legends — Ranked · Diamond IV · 2/3 squad
- Genshin Impact — AR 60 · Inazuma · Co-op 2/4
- Minecraft — Survival · SMP
- osu! — osu!standard · #12,345 · 6,842pp
- Rocket League — Ranked Doubles · Champion I
- FINAL FANTASY XIV — Duty Finder · Warrior
- Overwatch 2 — Competitive · Diamond 3 · Support

### Dev

- Visual Studio Code — TypeScript · 2 problems
- IntelliJ IDEA — Java · Spring Boot · Debugging
- Unity Editor — Scene: Rooftop · Play Mode

### Music

- Spotify — Midnight City · M83
- Apple Music — Nightcall · Kavinsky
- YouTube Music — Resonance · HOME
- SoundCloud — Sunset Lover · Petit Biscuit
- Ableton Live — Producing · Night Drive · 124 BPM

### Creative

- Figma — Designing · Widgets · 12 frames
- Blender — Rendering · Frame 148/240 · Cycles
- OBS Studio — Streaming · Twitch · 1080p60
- Photoshop — Editing keyart.psd · 4K
- DaVinci Resolve — Editing · Timeline 01 · 4K 24fps

## プリセットを追加する

`src/renderer/src/lib/presets.ts` の `SIMULATION_PRESETS` に追加します。

```ts
{
  id: 'example',
  name: 'Example Game',
  appName: 'Example Game',
  category: 'games',
  tagline: 'Ranked · Diamond · 3/5 party',
  description: '...',
  accent: '#8b7cff',
  secondary: '#62e6c4',
  activityType: 'playing',
  details: 'Ranked // 7 - 5',
  state: 'In Party',
  largeKey: 'example_cover',
  largeText: 'Example Map',
  smallKey: 'example_rank',
  smallText: 'Diamond II',
  party: { current: 3, max: 5 },
  buttons: [{ label: 'Stats', url: 'https://example.com' }],
  statusDisplay: 1,
  offsetMinutes: 28,
  assetKeys: [
    { key: 'example_cover', label: 'Large — cover' },
    { key: 'example_rank', label: 'Small — rank' }
  ]
}
```

## 注意

- 本機能はゲームの内部状態を読み取るものではありません。静的なプリセットを RPC に流し込みます。
- Discord のアプリ名・アイコンを完全に偽装することはできません。Application ID のアプリ情報が表示されます。
- Widgets v2 と同様、Discord の仕様変更により表示が変わることがあります。
- 各ゲームの利用規約・Discord の利用規約を確認し、自己責任で使用してください。
