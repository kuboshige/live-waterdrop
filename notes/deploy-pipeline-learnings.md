# デプロイ配管の学び（GitHub Pages × Service Worker × キャッシュ）

**結論: 「デプロイしたのに変わらない」の原因は3層あり、全部踏んだ。今は3層とも対策済み。**

## 1. GitHub Pages は HTML に `Cache-Control: max-age=600` を強制する
- HTML内の `<meta http-equiv="Cache-Control">` では**上書きできない**（メタはHTTPヘッダに勝てない）。
- 対策: network-first Service Worker + 毎回ユニークな `?v=` クエリを報告時に添付。

## 2. Service Worker の `fetch(req)` はデフォルトで HTTPキャッシュを読む
- 「network-first のつもり」でも `fetch(req)` 素呼びだと max-age=600 の古いHTMLを取得して
  それを自キャッシュに保存する＝**壊れた network-first**。
- 正解: `fetch(req, { cache: 'reload' })` でHTTPキャッシュを完全バイパス。
- 復旧経路として設定パネルに「🔄 最新に更新」ボタン（SW解除→全キャッシュ削除→
  `?fresh=Date.now()` でリロード）を常設。

## 3. GitHub Pages のビルド自体が時々失敗する（コード無関係）
- `pages build and deployment` ワークフローが `Deployment failed, try again later` で
  failure になることがある（このプロジェクトで数回観測。アーティファクト生成は成功、
  最後の公開ステップでGitHub側が拒否）。
- **ブランチが正しくてもサイトは古いまま**になる。キャッシュと誤診しやすい。
- 対策（運用ルール）: デプロイ後は Actions API で最新 run の conclusion == success を
  確認してからURLを報告する。failure なら BUILD 文字列を上げて空コミットで再デプロイ。

## 運用ルールまとめ
1. 変更ごとに `BUILD` 定数（設定パネル最下部に表示）を必ず更新 → どのビルドを見ているか常に判別可能。
2. デプロイ → Pages ビルド success 確認 → `?v=<BUILD>` 付きURLで報告。
3. ユーザーが古いビルドを見ていたら: ①新しい `?v=` ②「🔄最新に更新」ボタン ③シークレットタブ の順。
