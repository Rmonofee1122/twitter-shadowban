// パフォーマンス監視とメトリクス収集
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, any[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // API応答時間を記録
  recordApiCall(endpoint: string, duration: number, success: boolean) {
    const key = `api_${endpoint}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metric = {
      duration,
      success,
      timestamp: Date.now(),
    };

    this.metrics.get(key)?.push(metric);

    // 最新100件のみ保持
    const metrics = this.metrics.get(key);
    if (metrics && metrics.length > 100) {
      metrics.splice(0, metrics.length - 100);
    }
  }

  // 接続プール効率を記録
  recordConnectionPool(poolSize: number, cacheHit: boolean) {
    const key = "connection_pool";
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metric = {
      poolSize,
      cacheHit,
      timestamp: Date.now(),
    };

    this.metrics.get(key)?.push(metric);

    // 最新50件のみ保持
    const metrics = this.metrics.get(key);
    if (metrics && metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }
  }

  // 統計情報を取得
  getStats(endpoint?: string) {
    if (endpoint) {
      const key = `api_${endpoint}`;
      const metrics = this.metrics.get(key) || [];

      if (metrics.length === 0) return null;

      const durations = metrics.map((m) => m.duration);
      const successCount = metrics.filter((m) => m.success).length;

      return {
        totalRequests: metrics.length,
        successRate: (successCount / metrics.length) * 100,
        averageResponse:
          durations.reduce((a, b) => a + b, 0) / durations.length,
        minResponse: Math.min(...durations),
        maxResponse: Math.max(...durations),
        p95Response: this.percentile(durations, 0.95),
      };
    }

    // 全体統計
    const allStats: { [key: string]: any } = {};
    this.metrics.forEach((metrics, key) => {
      if (key.startsWith("api_")) {
        const endpoint = key.replace("api_", "");
        allStats[endpoint] = this.getStats(endpoint);
      }
    });

    return allStats;
  }

  // 接続プール統計
  getConnectionPoolStats() {
    const metrics = this.metrics.get("connection_pool") || [];

    if (metrics.length === 0) return null;

    const cacheHits = metrics.filter((m) => m.cacheHit).length;
    const avgPoolSize =
      metrics.reduce((sum, m) => sum + m.poolSize, 0) / metrics.length;

    return {
      totalConnections: metrics.length,
      cacheHitRate: (cacheHits / metrics.length) * 100,
      averagePoolSize: avgPoolSize,
      currentPoolSize: metrics[metrics.length - 1]?.poolSize || 0,
    };
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index] || 0;
  }

  // パフォーマンス警告チェック
  checkPerformanceAlerts(): string[] {
    const alerts: string[] = [];

    this.metrics.forEach((metrics, key) => {
      if (key.startsWith("api_")) {
        const recent = metrics.slice(-10); // 最新10件
        if (recent.length >= 5) {
          const avgDuration =
            recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
          const errorRate =
            recent.filter((m) => !m.success).length / recent.length;

          if (avgDuration > 5000) {
            // 5秒以上
            alerts.push(`${key}: 応答時間が遅い (${avgDuration.toFixed(0)}ms)`);
          }

          if (errorRate > 0.2) {
            // 20%以上のエラー率
            alerts.push(
              `${key}: エラー率が高い (${(errorRate * 100).toFixed(1)}%)`
            );
          }
        }
      }
    });

    return alerts;
  }
}

// パフォーマンス測定デコレータ
export function measurePerformance(endpoint: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      const monitor = PerformanceMonitor.getInstance();

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        monitor.recordApiCall(endpoint, duration, true);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        monitor.recordApiCall(endpoint, duration, false);
        throw error;
      }
    };
  };
}
