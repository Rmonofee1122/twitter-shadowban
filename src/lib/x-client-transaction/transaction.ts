import Cubic from "./cubic-curve";
import { interpolate } from "./interpolate";
import { convertRotationToMatrix } from "./rotation";
import { floatToHex, isOdd, base64Encode } from "./utils";
import { parseHTML } from "linkedom/worker";

// 正規表現の定義
const ON_DEMAND_FILE_REGEX = /(['"])ondemand\.s\1:\s*(['"])([\w]*)\2/;
const INDICES_REGEX = /\(\w\[(\d{1,2})\],\s*16\)/g;

type HomePageResponse = any; // Document または HTMLコンテンツに相当する型（簡略化）

class ClientTransaction {
  private static ADDITIONAL_RANDOM_NUMBER = 3;
  private static DEFAULT_KEYWORD = "obfiowerehiring";
  private DEFAULT_ROW_INDEX: number | null = null;
  private DEFAULT_KEY_BYTES_INDICES: number[] | null = null;

  private homePageResponse: any;
  private key: string | null = null;
  private keyBytes: number[] | null = null;
  private animationKey: string | null = null;
  private isInitialized: boolean = false;

  constructor(homePageResponse: HomePageResponse) {
    this.homePageResponse = this.validateResponse(homePageResponse);
  }

  // 非同期初期化メソッド - コンストラクタ後に呼び出す必要あり
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // インデックスを初期化
      [this.DEFAULT_ROW_INDEX, this.DEFAULT_KEY_BYTES_INDICES] =
        await this.getIndices(this.homePageResponse);

      // キーを取得
      this.key = this.getKey(this.homePageResponse);
      if (!this.key) throw new Error("Failed to get key");

      // キーバイトを取得
      this.keyBytes = this.getKeyBytes(this.key);

      // アニメーションキーを取得
      this.animationKey = this.getAnimationKey(
        this.keyBytes,
        this.homePageResponse
      );

      // 初期化完了フラグを設定
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize ClientTransaction:", error);
      throw error;
    }
  }

  // 静的ファクトリメソッド - 初期化済みのインスタンスを作成
  static async create(
    homePageResponse: HomePageResponse
  ): Promise<ClientTransaction> {
    const instance = new ClientTransaction(homePageResponse);
    await instance.initialize();
    return instance;
  }

  private async getIndices(
    homePageResponse?: any
  ): Promise<[number, number[]]> {
    const keyByteIndices: string[] = [];
    const response =
      this.validateResponse(homePageResponse) || this.homePageResponse;

    // ホームページレスポンスから正規表現を使用してファイル名を検索
    let responseStr = "";

    if (typeof response === "string") {
      responseStr = response;
    } else if (response.documentElement) {
      // Document オブジェクトの場合
      responseStr = response.documentElement.outerHTML;
    } else {
      // その他のオブジェクト
      responseStr = response.toString ? response.toString() : "";
    }

    let onDemandFileMatch = ON_DEMAND_FILE_REGEX.exec(responseStr);

    if (onDemandFileMatch) {
      const onDemandFileUrl = `https://abs.twimg.com/responsive-web/client-web/ondemand.s.${onDemandFileMatch[3]}a.js`;

      try {
        // fetchを使用してファイルを取得
        const onDemandFileResponse = await fetch(onDemandFileUrl);
        const responseText = await onDemandFileResponse.text();

        // 正規表現を使って必要な情報を抽出
        let match;
        INDICES_REGEX.lastIndex = 0; // 正規表現のインデックスをリセット
        while ((match = INDICES_REGEX.exec(responseText)) !== null) {
          keyByteIndices.push(match[1]);
        }
      } catch (error) {
        console.error("Error fetching ondemand file:", error);
      }
    }

    if (!keyByteIndices.length) {
      throw new Error("Couldn't get KEY_BYTE indices");
    }

    // 文字列から数値に変換
    const numericIndices = keyByteIndices.map((index) => parseInt(index, 10));
    return [numericIndices[0], numericIndices.slice(1)];
  }

  private validateResponse(response: any): any {
    // この実装は環境依存（ブラウザかNode.js）です
    if (!response) {
      throw new Error("invalid response");
    }
    return response;
  }

  private getKey(response?: any): string {
    response = this.validateResponse(response) || this.homePageResponse;

    let element;
    let content = "";

    // DOM操作
    if (response.querySelector) {
      // Document オブジェクトの場合
      element = response.querySelector("[name='twitter-site-verification']");
      if (element) {
        content = element.getAttribute("content");
      }
    } else if (typeof response === "string") {
      // HTML文字列の場合はlinkedomでパース
      const dom = parseHTML(response);
      element = dom.window.document.querySelector(
        "[name='twitter-site-verification']"
      );
      if (element) {
        content = element.getAttribute("content") || "";
      }
    }

    if (!content) {
      throw new Error("Couldn't get key from the page source");
    }
    return content;
  }

  private getKeyBytes(key: string): number[] {
    // Base64デコード（Node.js環境対応）
    try {
      if (typeof window === "undefined") {
        // Node.js環境
        const buffer = Buffer.from(key, "base64");
        return Array.from(buffer);
      } else {
        // ブラウザ環境
        const decoded = atob(key);
        return Array.from(decoded).map((char) => char.charCodeAt(0));
      }
    } catch (e) {
      throw new Error("Failed to decode key");
    }
  }

  private getFrames(response?: any): any[] {
    response = this.validateResponse(response) || this.homePageResponse;

    // Node.js環境とブラウザ環境の両方に対応
    if (response.querySelectorAll) {
      // Document オブジェクト
      return Array.from(response.querySelectorAll("[id^='loading-x-anim']"));
    } else if (typeof response === "string") {
      // HTML文字列
      const dom = parseHTML(response);
      return Array.from(
        dom.window.document.querySelectorAll("[id^='loading-x-anim']")
      );
    }

    return [];
  }

  private get2dArray(
    keyBytes: number[],
    response: any,
    frames?: any[]
  ): number[][] {
    if (!frames) {
      frames = this.getFrames(response);
    }
    // このメソッドはSVGパスの解析を行います
    if (!frames || !frames.length) {
      return [[]]; // 空の2次元配列を返す
    }

    // 1. フレームを選択し、子要素をたどって "d" 属性を取得
    const frame = frames[keyBytes[5] % 4];
    const firstChild = frame.children[0] as Element;
    const targetChild = firstChild.children[1] as Element;
    const dAttr = targetChild.getAttribute("d");
    if (dAttr === null) {
      // 属性がない場合は空配列を返す
      return [];
    }

    // 2. 文字列の先頭 9 文字を取り除き、"C" で分割
    const items = dAttr.substring(9).split("C");

    // 3. 各セグメントから数字だけを抜き出して整数化
    return items.map((item) => {
      // a) 非数字をスペースに置換
      const cleaned = item.replace(/[^\d]+/g, " ").trim();
      // b) 空文字チェック後、空白で分割
      const parts = cleaned === "" ? [] : cleaned.split(/\s+/);
      // c) 各文字列を 10 進数で整数に変換
      return parts.map((str) => parseInt(str, 10));
    });
  }

  private solve(
    value: number,
    minVal: number,
    maxVal: number,
    rounding: boolean
  ): number {
    const result = (value * (maxVal - minVal)) / 255 + minVal;
    return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
  }

  private animate(frames: number[], targetTime: number): string {
    const fromColor = frames.slice(0, 3).concat(1).map(Number);
    const toColor = frames.slice(3, 6).concat(1).map(Number);
    const fromRotation = [0.0];
    const toRotation = [this.solve(frames[6], 60.0, 360.0, true)];

    const remainingFrames = frames.slice(7);
    const curves = remainingFrames.map((item, counter) =>
      this.solve(item, isOdd(counter), 1.0, false)
    );

    const cubic = new Cubic(curves);
    const val = cubic.getValue(targetTime);
    const color = interpolate(fromColor, toColor, val).map((value) =>
      value > 0 ? value : 0
    );
    const rotation = interpolate(fromRotation, toRotation, val);
    const matrix = convertRotationToMatrix(rotation[0]);

    // 色と行列の値を16進数文字列に変換
    const strArr: string[] = color
      .slice(0, -1)
      .map((value) => Math.round(value).toString(16));

    for (const value of matrix) {
      let rounded = Math.round(value * 100) / 100;
      if (rounded < 0) {
        rounded = -rounded;
      }
      const hexValue = floatToHex(rounded);
      strArr.push(
        hexValue.startsWith(".")
          ? `0${hexValue}`.toLowerCase()
          : hexValue || "0"
      );
    }

    strArr.push("0", "0");
    const animationKey = strArr.join("").replace(/[.-]/g, "");
    return animationKey;
  }

  private getAnimationKey(keyBytes: number[], response: any): string {
    const totalTime = 4096;

    if (!this.DEFAULT_ROW_INDEX || !this.DEFAULT_KEY_BYTES_INDICES) {
      throw new Error("Indices not initialized");
    }

    const rowIndex = keyBytes[this.DEFAULT_ROW_INDEX] % 16;

    // キーバイトのインデックスを使用して数値を生成
    const frameTime = this.DEFAULT_KEY_BYTES_INDICES.reduce((num1, num2) => {
      return num1 * (keyBytes[num2] % 16);
    }, 1);

    const arr = this.get2dArray(keyBytes, response);
    if (!arr || !arr[rowIndex]) {
      throw new Error("Invalid frame data");
    }

    const frameRow = arr[rowIndex];
    const targetTime = frameTime / totalTime;
    const animationKey = this.animate(frameRow, targetTime);

    return animationKey;
  }

  async generateTransactionId(
    method: string,
    path: string,
    response?: any,
    key?: string,
    animationKey?: string,
    timeNow?: number
  ): Promise<string> {
    // インスタンスが初期化されているか確認
    if (!this.isInitialized) {
      throw new Error(
        "ClientTransaction is not initialized. Call initialize() before using."
      );
    }

    timeNow = timeNow || Math.floor((Date.now() - 1682924400 * 1000) / 1000);
    const timeNowBytes = [
      timeNow & 0xff,
      (timeNow >> 8) & 0xff,
      (timeNow >> 16) & 0xff,
      (timeNow >> 24) & 0xff,
    ];

    key = key || this.key || this.getKey(response);
    const keyBytes = this.keyBytes || this.getKeyBytes(key);
    animationKey =
      animationKey ||
      this.animationKey ||
      this.getAnimationKey(keyBytes, response);

    // ハッシュ値の生成
    const data = `${method}!${path}!${timeNow}${ClientTransaction.DEFAULT_KEYWORD}${animationKey}`;

    // SHA-256ハッシュを計算（Node.js/ブラウザ環境両対応）
    let hashBytes: number[];

    // ブラウザ環境（Web Crypto API）
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    hashBytes = Array.from(new Uint8Array(hashBuffer));

    const randomNum = Math.floor(Math.random() * 256);
    const bytesArr = [
      ...keyBytes,
      ...timeNowBytes,
      ...hashBytes.slice(0, 16),
      ClientTransaction.ADDITIONAL_RANDOM_NUMBER,
    ];

    const out = new Uint8Array([
      randomNum,
      ...bytesArr.map((item) => item ^ randomNum),
    ]);
    return base64Encode(out).replace(/=/g, "");
  }
}

export default ClientTransaction;
