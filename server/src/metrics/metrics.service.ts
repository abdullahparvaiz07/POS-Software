import promClient from "prom-client";

// Default metrics are collected by express-prom-bundle in app.ts

class MetricsService {
  public databaseQueryDuration = new promClient.Histogram({
    name: "db_query_duration_seconds",
    help: "Duration of database queries in seconds",
    labelNames: ["query", "model"],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  });

  public slowQueriesTotal = new promClient.Counter({
    name: "db_slow_queries_total",
    help: "Total number of slow database queries (>500ms)",
    labelNames: ["query", "model"],
  });

  public activeOrders = new promClient.Gauge({
    name: "business_active_orders",
    help: "Number of active orders currently in the system",
  });

  public revenueTotal = new promClient.Counter({
    name: "business_revenue_total",
    help: "Total revenue generated",
  });

  public async getMetrics() {
    return await promClient.register.metrics();
  }
}

export const metricsService = new MetricsService();
