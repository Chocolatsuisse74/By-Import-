import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface MetricLabel {
  [key: string]: string;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  help: string;
  labels?: string[];
  samples: Map<string, number>;
}

export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private requestStartTimes: WeakMap<Request, number> = new WeakMap();

  constructor() {
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    // HTTP Request metrics
    this.createMetric('http_requests_total', 'counter', 'Total HTTP requests');
    this.createMetric('http_request_duration_ms', 'histogram', 'HTTP request duration in ms');
    this.createMetric('http_requests_active', 'gauge', 'Active HTTP requests');

    // Import job metrics
    this.createMetric('import_jobs_total', 'counter', 'Total import jobs');
    this.createMetric('import_jobs_success_total', 'counter', 'Successful import jobs');
    this.createMetric('import_jobs_failed_total', 'counter', 'Failed import jobs');
    this.createMetric('import_records_processed_total', 'counter', 'Total records processed');
    this.createMetric('import_records_failed_total', 'counter', 'Total records failed');

    // System metrics
    this.createMetric('process_memory_usage_bytes', 'gauge', 'Process memory usage in bytes');
    this.createMetric('process_uptime_seconds', 'gauge', 'Process uptime in seconds');
  }

  private createMetric(
    name: string,
    type: 'counter' | 'gauge' | 'histogram',
    help: string
  ): void {
    this.metrics.set(name, {
      name,
      type,
      help,
      samples: new Map(),
    });
  }

  requestMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      this.requestStartTimes.set(req, startTime);

      // Increment active requests
      this.incrementGauge('http_requests_active', 1);

      const originalEnd = res.end.bind(res);
      const self = this;
      res.end = function (...args: unknown[]): Response {
        const duration = Date.now() - startTime;

        // Decrement active requests
        self.decrementGauge('http_requests_active', 1);

        // Track request metrics
        self.incrementCounter('http_requests_total', 1);
        self.recordHistogram('http_request_duration_ms', duration);

        return originalEnd(...(args as [(() => void) | undefined]));
      } as any;

      next();
    };
  }

  incrementCounter(name: string, value: number = 1, labels?: MetricLabel): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      logger.warn({ name }, 'Counter metric not found');
      return;
    }

    const key = this.buildLabelKey(labels);
    const current = metric.samples.get(key) || 0;
    metric.samples.set(key, current + value);
  }

  setGauge(name: string, value: number, labels?: MetricLabel): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      logger.warn({ name }, 'Gauge metric not found');
      return;
    }

    const key = this.buildLabelKey(labels);
    metric.samples.set(key, value);
  }

  incrementGauge(name: string, value: number = 1, labels?: MetricLabel): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      logger.warn({ name }, 'Gauge metric not found');
      return;
    }

    const key = this.buildLabelKey(labels);
    const current = metric.samples.get(key) || 0;
    metric.samples.set(key, current + value);
  }

  decrementGauge(name: string, value: number = 1, labels?: MetricLabel): void {
    this.incrementGauge(name, -value, labels);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabel): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      logger.warn({ name }, 'Histogram metric not found');
      return;
    }

    const key = this.buildLabelKey(labels);
    metric.samples.set(key, (metric.samples.get(key) || 0) + value);
  }

  private buildLabelKey(labels?: MetricLabel): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return JSON.stringify(labels);
  }

  getMetrics(): string {
    const lines: string[] = [];

    // System metrics
    const uptime = process.uptime();
    this.setGauge('process_uptime_seconds', uptime);

    const memUsage = process.memoryUsage();
    this.setGauge('process_memory_usage_bytes', memUsage.heapUsed);

    // Generate Prometheus format
    for (const [, metric] of this.metrics) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      for (const [labels, value] of metric.samples) {
        const labelStr = labels ? ` ${labels}` : '';
        lines.push(`${metric.name}${labelStr} ${value}`);
      }
    }

    return lines.join('\n');
  }

  exportMetrics() {
    return (_req: Request, res: Response) => {
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.send(this.getMetrics());
    };
  }
}

let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
  }
  return metricsCollector;
}
