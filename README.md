# X (Twitter) Shadowban Checker

https://shadowban.lami.zip/

このプロジェクトは、X（旧Twitter）ユーザーがシャドウバン状態を確認できるウェブアプリケーションです。ユーザー名を入力するだけで、各種シャドウバンの状態を分析・表示します。

## シャドウバンについて

シャドウバンとは、X (Twitter) において、アカウントがロックや凍結されていないにも関わらず、検索結果や返信一覧に表示されなくなる状態のことです。このアプリでは以下の種類のシャドウバンを検出します：

- **検索候補からの除外** - 検索画面において、検索候補から該当のアカウントが表示されなくなります
- **検索結果からの除外** - 検索結果から、該当のアカウントのツイートやアカウントが表示されなくなります
- **返信一覧からの除外(ゴーストバン)** - ポストに対する返信が返信一覧から表示されなくなります
- **返信一覧での表示順の低下(返信デブースト)** - ポストに対する返信が返信一覧にて下部に表示されます

## 技術スタック

- [Next.js](https://nextjs.org/) 14.1.1
- [React](https://react.dev/) 18
- [TypeScript](https://www.typescriptlang.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [NextUI](https://nextui.org/)
- [Hono](https://hono.dev/) - API実装
- [Zod OpenAPI](https://github.com/honojs/zod-openapi) - APIスキーマ定義

## 開発環境のセットアップ

このプロジェクトを開発するための環境設定手順です。

### 必要条件

- Node.js 18.x 以上
- npm 8.x 以上 または yarn 1.22.x 以上
- VSCode（推奨エディタ）

### インストール方法

1. このリポジトリをクローンする
```bash
git clone https://github.com/Shadowban-Test/X.git
cd X
```

2. 依存関係をインストールする
```bash
npm install
# または
yarn install
```

3. 環境変数を設定する
`.env.local`ファイルをプロジェクトのルートに作成し、以下の内容を記入します：
```
AUTH_TOKEN=YourXAuthToken
```

4. 開発サーバーを起動する
```bash
npm run dev
# または
yarn dev
```

## API ドキュメント

このプロジェクトではOpenAPI仕様に基づいたAPIドキュメントを提供しています。開発サーバー起動後、以下のURLでSwagger UIを確認できます：

```
http://localhost:3000/api/docs
```

## プロジェクト構成

```
src/
  ├── app/              # Next.js App Routerのファイル
  │   ├── api/          # APIエンドポイント
  │   └── page.tsx      # メインページ
  ├── components/       # 再利用可能なReactコンポーネント
  └── lib/              # ユーティリティ関数やヘルパー
      └── x-client-transaction/ # X API用のクライアントトランザクション機能
```

## 貢献方法

このプロジェクトへの貢献をお待ちしています！以下の手順で貢献できます：

1. このリポジトリをフォークする
2. 機能追加やバグ修正のためのブランチを作成する (`git checkout -b feature/amazing-feature`)
3. 変更をコミットする (`git commit -m '新機能: 素晴らしい機能を追加'`)
4. ブランチにプッシュする (`git push origin feature/amazing-feature`)
5. プルリクエストを作成する

### コーディング規約

- TypeScriptの型は適切に定義してください
- コンポーネントは機能ごとに分割し、再利用可能にしてください
- コメントは日本語で記述してください
- コミットメッセージは具体的に何を変更したか明記してください

## 問題の報告

バグを発見した場合や新機能のリクエストがある場合は、GitHubのIssueを作成してください。その際、以下の情報を含めると助かります：

- バグの場合：具体的な再現手順、期待される動作、実際の動作
- 新機能の場合：提案する機能の詳細な説明と、それがどのように役立つか

## ライセンス

このプロジェクトはGPL-3.0ライセンスの下で公開されています。詳細は[LICENSE](./LICENSE)ファイルをご覧ください。

## 謝辞

このプロジェクトは以下の素晴らしいオープンソースプロジェクトに支えられています：

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Hono](https://hono.dev/)
- [NextUI](https://nextui.org/)
- [TailwindCSS](https://tailwindcss.com/)

## お問い合わせ

質問や提案がございましたら、以下の方法でお問い合わせください：

- [GitHub Issue](https://github.com/Shadowban-Test/X/issues)
- メール: info@lami.zip
