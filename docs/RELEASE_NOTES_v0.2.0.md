# Presence Studio v0.2.0

ゲーム・開発ツール・音楽アプリの **RPCプリセット** を追加しました。

## 新機能

### Presets / 疑似プレイ

有名どころの Discord RPC 連携で表示されるフィールドを、ワンクリックで Presence Studio に展開できます。

- **ゲーム**: VALORANT / League of Legends / Counter-Strike 2 / Apex Legends /
  Genshin Impact / Minecraft / osu! / Rocket League / FFXIV / Overwatch 2
- **開発**: Visual Studio Code / IntelliJ IDEA / Unity
- **音楽**: Spotify / Apple Music / YouTube Music / SoundCloud / Ableton Live
- **制作**: Figma / Blender / OBS Studio / Photoshop / DaVinci Resolve

ランク・RR・KDA・マップ・スコア・パーティ人数・再生中の曲・ファイル名などを
そのまま Presence の詳細 / ステータス / 画像 / ボタン / タイマーに反映します。

### プリセット詳細

- 適用前に Discord 風プレビューで確認
- プリセットごとの Application ID を指定可能
- Asset Key の一覧とコピー
- ボタンURLの確認
- **Presence に適用** / **適用して Go live**

## 注意

- プリセットは公開RPC実装のフィールド構造を参考にした **ファンメイドのシミュレーション** です。
  各ゲーム・アプリの公式提供ではありません。
- Discord に表示されるアプリ名・アイコンは **Application ID のアプリ情報**です。
  プリセット名を表示するには、同じ名前の Discord Application を用意してください。
- 画像は Developer Portal の Art Assets に、プリセットの Asset Key と同じ名前で
  アップロードすると表示されます。
- Streaming アクティビティは Discord RPC の制限により未対応です。

## ダウンロード

Windows 10 / 11（x64）向け ZIP です。

1. **Assets** から `Presence-Studio-0.2.0-win64.zip` をダウンロード
2. ZIP を右クリック →「すべて展開」
3. `Presence Studio.exe` を実行

コード署名なしのため、初回起動時に SmartScreen の警告が出る場合は
「詳細情報」→「実行」を選択してください。

## 技術メモ

- プリセットのデータは `src/renderer/src/lib/presets.ts`
- 参考元・制約は [docs/PRESETS.md](https://github.com/4uthen7/presence-studio/blob/main/docs/PRESETS.md)
- RPC / ビルドの詳細は [docs/DEVELOPMENT.md](https://github.com/4uthen7/presence-studio/blob/main/docs/DEVELOPMENT.md)
