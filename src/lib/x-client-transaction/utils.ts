import { parseHTML } from "linkedom/worker";
import ky from "ky";

// handleXMigration関数をNode.js環境でも動作するように修正
async function handleXMigration() {
  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "ja",
    "cache-control": "no-cache",
    pragma: "no-cache",
    priority: "u=0, i",
    "sec-ch-ua":
      '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  };

  // fetchを使用してX.comにアクセス
  const response = await fetch("https://x.com", {
    headers,
  });
  const htmlText = await response.text();

  // を使ってHTMLをパース
  let dom = parseHTML(htmlText);
  let document = dom.window.document;

  // マイグレーションリダイレクションのチェック
  const migrationRedirectionRegex = new RegExp(
    "(http(?:s)?://(?:www\\.)?(twitter|x){1}\\.com(/x)?/migrate([/?])?tok=[a-zA-Z0-9%\\-_]+)+",
    "i"
  );

  const metaRefresh = document.querySelector("meta[http-equiv='refresh']");
  const metaContent = metaRefresh
    ? metaRefresh.getAttribute("content") || ""
    : "";

  let migrationRedirectionUrl =
    migrationRedirectionRegex.exec(metaContent) ||
    migrationRedirectionRegex.exec(htmlText);

  if (migrationRedirectionUrl) {
    // リダイレクション先URLにアクセス
    const redirectResponse = await fetch(migrationRedirectionUrl[0]);
    const redirectHtml = await redirectResponse.text();
    dom = parseHTML(redirectHtml);
    document = dom.window.document;
  }

  // マイグレーションフォームの処理
  const migrationForm =
    document.querySelector("form[name='f']") ||
    document.querySelector("form[action='https://x.com/x/migrate']");

  if (migrationForm) {
    const url =
      migrationForm.getAttribute("action") || "https://x.com/x/migrate";
    const method = migrationForm.getAttribute("method") || "POST";

    // フォームから入力フィールドを取得
    const requestPayload = new FormData();

    const inputFields = migrationForm.querySelectorAll("input");
    // @ts-ignore
    inputFields.forEach((element) => {
      const name = element.getAttribute("name");
      const value = element.getAttribute("value");
      if (name && value) {
        requestPayload.append(name, value);
      }
    });

    // POSTリクエストを送信
    const formResponse = await fetch(url, {
      method: method,
      body: requestPayload,
      headers,
    });

    const formHtml = await formResponse.text();
    dom = parseHTML(formHtml);
    document = dom.window.document;
  }

  // DOM documentを返す
  return document;
}

// 浮動小数点数を16進数に変換
function floatToHex(x: number): string {
  const result: string[] = [];
  let quotient = Math.floor(x);
  let fraction = x - quotient;

  while (quotient > 0) {
    quotient = Math.floor(x / 16);
    const remainder = Math.floor(x - quotient * 16);

    if (remainder > 9) {
      result.unshift(String.fromCharCode(remainder + 55));
    } else {
      result.unshift(remainder.toString());
    }

    x = quotient;
  }

  if (fraction === 0) {
    return result.join("");
  }

  result.push(".");

  while (fraction > 0) {
    fraction *= 16;
    const integer = Math.floor(fraction);
    fraction -= integer;

    if (integer > 9) {
      result.push(String.fromCharCode(integer + 55));
    } else {
      result.push(integer.toString());
    }
  }

  return result.join("");
}

// 奇数かどうかを判定
function isOdd(num: number): number {
  if (num % 2) {
    return -1.0;
  }
  return 0.0;
}

// Base64エンコード (Node.js環境対応)
function base64Encode(input: string | Uint8Array): string {
  if (typeof window === "undefined") {
    // Node.js環境
    if (typeof input === "string") {
      return Buffer.from(input).toString("base64");
    }
    return Buffer.from(input).toString("base64");
  } else {
    // ブラウザ環境
    if (typeof input === "string") {
      return btoa(input);
    }
    return btoa(String.fromCharCode.apply(null, Array.from(input)));
  }
}

// Base64デコード (Node.js環境対応)
function base64Decode(input: string): string {
  if (typeof window === "undefined") {
    // Node.js環境
    const buffer = Buffer.from(input, "base64");
    return buffer.toString("utf-8");
  } else {
    // ブラウザ環境
    return atob(input);
  }
}

export { handleXMigration, floatToHex, isOdd, base64Encode, base64Decode };
