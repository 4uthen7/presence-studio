# Presence Studio v0.1.0

最初の公開リリースです。

## ダウンロード

Windows 10 / 11（x64）向けの ZIP です。

1. 下の **Assets** から `Presence-Studio-0.1.0-win64.zip` をダウンロード
2. ZIP を右クリック →「すべて展開」
3. フォルダ内の **`Presence Studio.exe`** を実行

インストールは不要です。コード署名を行っていないため、初回起動時に SmartScreen の警告が出る場合は
「詳細情報」→「実行」を選択してください。

## ハイライト

- ブロックをドラッグ＆ドロップして作る Discord Rich Presence エディタ
- Discord デスクトップクライアントへのローカル IPC 接続
- Discord 風のアクティビティ / プロフィールプレビュー
- Widgets v2 のデータ編集・プレビュー・公開
- ペルソナ管理（アバター / バナー / バッジ / リンク / 自己紹介）
- Presence / Widget テンプレート、アセットライブラリ
- トレイ常駐、グローバルホットキー、自動起動
- ブラウザプレビューモード

## 注意

- Widgets v2 は Discord の実験的機能です。仕様変更・停止の可能性があります。
- Widget の見た目のレイアウトは Discord Developer Portal の Widget エディタで作成します。
  本アプリはデータの設計・プレビュー・公開を担当します。
- Streaming アクティビティは Discord RPC の制限により未対応です。
- プロフィールのバナー・バッジ等はプレビュー用です。Discord アカウントを変更しません。
- Discord Inc. とは無関係の非公式ツールです。

## 動作確認

- Windows 10 / 11 x64
- Discord デスクトップアプリ
- Discord IPC: READY → SET_ACTIVITY → clear を実機で確認
- 型チェック / 本番ビルド成功

詳細な使い方は [README](https://github.com/4uthen7/presence-studio#readme) を参照してください。
