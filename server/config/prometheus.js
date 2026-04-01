import { Registry, collectDefaultMetrics, Histogram, Counter, Gauge } from 'prom-client';

const register = new Registry();
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeSocketConnections = new Gauge({
  name: 'active_socket_connections',
  help: 'Active Socket.IO connections',
  labelNames: ['namespace'],
  registers: [register],
});

export const ordersTotal = new Counter({
  name: 'orders_total',
  help: 'Total orders created',
  labelNames: ['status'],
  registers: [register],
});

export { register };
