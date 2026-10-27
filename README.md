# 📲 ありが飴 ─ PWA 版（スマホのホーム画面に置けるアプリ）

ホーム画面から開くと、ブラウザのバーなしでアプリのように使えます。
データは **Cloudflare Workers + D1**（`../worker/`）に保存され、社内みんなで共有されます。

```
スマホ（ホーム画面のアイコン）
   │  GitHub Pages（https://kazuya-tk.github.io/arigaame/）に置いた静的ファイル（このフォルダ）
   ▼
Cloudflare Worker（../worker/src/index.js） ──▶ D1（SQLite）
```

> `config.js` の `API_URL` が空のままだと **デモモード**（その端末だけに保存・サンプル入り）で動きます。

---

## ① API（Cloudflare Worker）をデプロイする

`../worker/README.md` の手順どおり（`npx wrangler login --device` → `PASSCODE='合言葉' ./deploy.sh`）。
最後に表示される `https://arigaame-api.xxxx.workers.dev` をコピー。

## ② config.js に URL を入れる

```js
window.ARIGAAME_CONFIG = {
  API_URL: 'https://arigaame-api.xxxx.workers.dev'
};
```

画面が見えている間は 12 秒ごと＋画面に戻ったときに最新を取りに行くので、ほかの人が入れた飴もほぼリアルタイムで瓶に落ちてきます（画面を閉じている間は通信しません）。

## ③ 公開する（HTTPS が必要）

### GitHub Pages（無料・おすすめ）
1. GitHub で新しいリポジトリを作る（例：`arigaame`）。※無料プランでは Public リポジトリが必要です。
2. **Add file > Upload files** で、この `pwa` フォルダの**中身**（`index.html`, `config.js`, `manifest.webmanifest`, `sw.js`, `icons/`, `.nojekyll`）をドラッグ＆ドロップ → Commit。
3. **Settings > Pages** → Source：**Deploy from a branch**、Branch：`main` / `/ (root)` → Save。
4. 1〜2分で `https://<ユーザー名>.github.io/arigaame/` が公開されます。この URL を社内に共有！

> 公開されるのはアプリの見た目（HTML/JS/アイコン）と API の URL だけです。飴やありがとうのデータは Cloudflare D1 にあり、合言葉を設定すれば合言葉なしでは読めません。

### もっと手軽に：Netlify Drop
<https://app.netlify.com/drop> を開いて `pwa` フォルダをドラッグ＆ドロップするだけで HTTPS の URL が発行されます（アカウント作成でURLを固定・更新できます）。

### 更新するとき
`src/` を直したら `python3 build.py` → できた `pwa/` の中身を再アップロード。
各スマホでは、次にアプリを開いたとき裏で更新され、その次に開いたときから新しい版になります。

## ④ 各自のスマホでホーム画面に追加

- **iPhone**：**Safari** で URL を開く → 下の **共有ボタン（□に↑）** → **「ホーム画面に追加」** → **追加**。
  ※ホーム画面のアプリは Safari とは保存領域が別なので、合言葉と名前を最初に1回だけ聞かれます。
- **Android**：**Chrome** で URL を開く → 画面上の「📲 追加する」ボタン、または右上 **︙ メニュー → 「ホーム画面に追加」→「インストール」**。

アイコン（🍬 にっこり飴）をタップすると、アプリのように全画面で開きます。

---

## 付録：Apps Script（スプレッドシート）を API にする場合（旧方式）

`API_URL` に `https://script.google.com/macros/s/……/exec` を入れると自動で Apps Script 方式で通信します。

### Apps Script を API にする

1. Google スプレッドシートを新規作成 → **拡張機能 > Apps Script**。
2. `コード.gs` の中身を `../gas/Code.gs` に置き換え。
   （画面版も一緒に使うなら ＋ > HTML で `index` を作り `../gas/index.html` を貼り付け。PWA だけなら不要）
3. **合言葉を設定（強くおすすめ）**：左の ⚙️ **プロジェクトの設定 > スクリプト プロパティ > 追加**
   プロパティ `PASSCODE`、値に社内で共有する合言葉（例：`あめちゃん2026`）→ 保存。
4. **デプロイ > 新しいデプロイ > 種類：ウェブアプリ**
   - 次のユーザーとして実行：**自分**
   - アクセスできるユーザー：**全員**  ← ⚠️ ここが重要（下の「注意」を参照）
5. 表示された **ウェブアプリの URL**（`https://script.google.com/macros/s/……/exec`）をコピー。

### ⚠️ 注意：アクセス設定は「全員」が必要です
- **「（会社名）内の全員」（組織内）では PWA から使えません。**
  GitHub Pages など別のサイトからの通信には Google のログイン情報（Cookie）が付かないため、Google のログイン画面へ転送されてブラウザに通信をブロックされます（CORS エラー）。
- そのため **「全員」**（Google ログイン不要）でデプロイします。
  **トレードオフ**：API の URL を知っている人なら社外の人でも読み書きできてしまいます。
  → 上の **合言葉（PASSCODE）** を必ず設定してください。合言葉はスプレッドシート側だけに置かれ、公開ファイルには含まれません（各スマホが初回に1回だけ聞いて端末に覚えます）。
  ※合言葉は「通りすがりの人よけ」程度の仕組みです。飴の名前や名前・ひとこと程度の情報に限って使ってください。
- 会社の Google Workspace の管理設定によっては「全員」が選べない／外部公開が禁止されている場合があります。
  その場合は PWA 版はあきらめ、`../gas/` の画面版（アクセス「組織内の全員」）を使ってください。ホーム画面にブックマークとして置けますが、アプリ表示（ブラウザのバーなし）やオフライン表示にはなりません。
- `Code.gs` を直したら **デプロイ > デプロイを管理 > ✏️ > バージョン：新バージョン > デプロイ**（URL は変わりません）。

### config.js

```js
window.ARIGAAME_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/……/exec'
};
```

