import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GoogleTagManager } from '@next/third-parties/google'
import "./globals.css";

const BASE_URL = "https://shadowban.lami.zip";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "X (Twitter) Shadowban Test",
  description: "X (Twitter)のユーザーがシャドウバンされているかを確認することが出来るWebツール",
  keywords: ["X", "Twitter", "Shadowban", "Test", "Check", "Search Suggestion Ban", "Search Ban", "Ghost Ban", "Reply Deboosting", "エックス", "ツイッター", "シャドウバン", "テスト", "チェック", "サーチサジェスチョンバン", "サーチバン", "ゴーストバン", "リプライデブースティング"],
  openGraph: {
    title: "X (Twitter) Shadowban Test",
    description: "X (Twitter)のユーザーがシャドウバンされているかを確認することが出来るWebツール",
    url: BASE_URL,
    siteName: "X (Twitter) Shadowban Test",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
      <GoogleTagManager gtmId={process.env.GTM_ID ?? ''} />
    </html>
  );
}
