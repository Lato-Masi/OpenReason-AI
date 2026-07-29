import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'OpenReasonDB';
const EXECUTION_STORE = 'execution_memory';
const BENCHMARK_STORE = 'benchmark_evaluations';
const VERSION = 2;

export interface MemoryEntry {
  id?: number;
  prompt: string;
  strategy: string;
  mode: string;
  primaryModality?: string;
  domainParadigm?: string;
  domainFramework?: string;
  finalAnswer: string;
  stepsCount?: number;
  totalTokens?: number;
  estimatedCost?: number;
  durationMs?: number;
  timestamp: number;
  anomalyFlag?: boolean;
  steps?: any[];
}

export interface StoredBenchmarkReport {
  id?: number;
  benchmarkId: string;
  benchmarkTitle: string;
  category?: string;
  model: string;
  verdict: 'PASS' | 'PARTIAL' | 'FAIL';
  overallScore: number;
  canonicalScore: number;
  astScore: number;
  keywordScore: number;
  contextIntegrityScore: number;
  overthinkingPenalty: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  actualCostUSD: number;
  formattedCost: string;
  latencyMs: number;
  summaryText: string;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(EXECUTION_STORE)) {
            const store = db.createObjectStore(EXECUTION_STORE, {
              keyPath: 'id',
              autoIncrement: true,
            });
            store.createIndex('timestamp', 'timestamp');
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(BENCHMARK_STORE)) {
            const benchStore = db.createObjectStore(BENCHMARK_STORE, {
              keyPath: 'id',
              autoIncrement: true,
            });
            benchStore.createIndex('timestamp', 'timestamp');
            benchStore.createIndex('benchmarkId', 'benchmarkId');
            benchStore.createIndex('verdict', 'verdict');
          }
        }
      },
    });
  }
  return dbPromise;
}

// Memory / Execution Trace Operations
export async function saveMemory(entry: Omit<MemoryEntry, 'id'>) {
  const db = await getDB();
  return db.add(EXECUTION_STORE, entry);
}

export async function getRecentMemory(limit = 20): Promise<MemoryEntry[]> {
  const db = await getDB();
  const tx = db.transaction(EXECUTION_STORE, 'readonly');
  const index = tx.store.index('timestamp');
  let cursor = await index.openCursor(null, 'prev');
  const results: MemoryEntry[] = [];
  
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return results;
}

export async function deleteMemoryEntry(id: number) {
  const db = await getDB();
  return db.delete(EXECUTION_STORE, id);
}

export async function clearMemory() {
  const db = await getDB();
  return db.clear(EXECUTION_STORE);
}

// Benchmark Evaluation Operations
export async function saveBenchmarkReport(report: Omit<StoredBenchmarkReport, 'id'>) {
  const db = await getDB();
  return db.add(BENCHMARK_STORE, report);
}

export async function getBenchmarkReports(limit = 50): Promise<StoredBenchmarkReport[]> {
  const db = await getDB();
  const tx = db.transaction(BENCHMARK_STORE, 'readonly');
  const index = tx.store.index('timestamp');
  let cursor = await index.openCursor(null, 'prev');
  const results: StoredBenchmarkReport[] = [];
  
  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }
  
  return results;
}

export async function clearBenchmarkReports() {
  const db = await getDB();
  return db.clear(BENCHMARK_STORE);
}

// Aggregate Telemetry & Benchmark Metrics
export async function getTelemetryMetrics() {
  const db = await getDB();
  const executions: MemoryEntry[] = await db.getAll(EXECUTION_STORE);
  const benchmarks: StoredBenchmarkReport[] = await db.getAll(BENCHMARK_STORE);

  const totalExecutions = executions.length;
  const totalBenchmarkRuns = benchmarks.length;

  const totalTokens = 
    executions.reduce((acc, e) => acc + (e.totalTokens || 0), 0) +
    benchmarks.reduce((acc, b) => acc + (b.totalTokens || 0), 0);

  const totalCostUSD = 
    executions.reduce((acc, e) => acc + (e.estimatedCost || 0), 0) +
    benchmarks.reduce((acc, b) => acc + (b.actualCostUSD || 0), 0);

  const avgBenchmarkScore = benchmarks.length > 0
    ? Math.round(benchmarks.reduce((acc, b) => acc + b.overallScore, 0) / benchmarks.length)
    : 0;

  const avgContextIntegrity = benchmarks.length > 0
    ? Math.round(benchmarks.reduce((acc, b) => acc + (b.contextIntegrityScore || 100), 0) / benchmarks.length)
    : 100;

  const avgOverthinkingPenalty = benchmarks.length > 0
    ? (benchmarks.reduce((acc, b) => acc + (b.overthinkingPenalty || 0), 0) / benchmarks.length).toFixed(1)
    : '0.0';

  const avgBenchmarkLatency = benchmarks.length > 0
    ? Math.round(benchmarks.reduce((acc, b) => acc + b.latencyMs, 0) / benchmarks.length)
    : 0;

  const passCount = benchmarks.filter(b => b.verdict === 'PASS').length;
  const partialCount = benchmarks.filter(b => b.verdict === 'PARTIAL').length;
  const failCount = benchmarks.filter(b => b.verdict === 'FAIL').length;

  // Breakdown by Category / Modality
  const categoryStats: Record<string, { total: number; sumScore: number; passCount: number; avgScore: number }> = {};
  
  benchmarks.forEach(b => {
    const cat = b.category || 'Standard Suite';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, sumScore: 0, passCount: 0, avgScore: 0 };
    }
    categoryStats[cat].total += 1;
    categoryStats[cat].sumScore += b.overallScore;
    if (b.verdict === 'PASS') categoryStats[cat].passCount += 1;
  });

  Object.keys(categoryStats).forEach(cat => {
    categoryStats[cat].avgScore = Math.round(categoryStats[cat].sumScore / categoryStats[cat].total);
  });

  return {
    totalExecutions,
    totalBenchmarkRuns,
    totalTokens,
    totalCostUSD,
    avgBenchmarkScore,
    avgContextIntegrity,
    avgOverthinkingPenalty,
    avgBenchmarkLatency,
    passCount,
    partialCount,
    failCount,
    categoryStats,
    recentExecutions: executions.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20),
    recentBenchmarks: benchmarks.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30),
  };
}

export async function exportAllTelemetry() {
  const db = await getDB();
  const executions = await db.getAll(EXECUTION_STORE);
  const benchmarks = await db.getAll(BENCHMARK_STORE);
  
  return {
    exportVersion: '1.0',
    timestamp: new Date().toISOString(),
    executions,
    benchmarks,
  };
}

export async function importTelemetryData(data: { executions?: any[]; benchmarks?: any[] }) {
  const db = await getDB();
  if (data.executions && Array.isArray(data.executions)) {
    const tx = db.transaction(EXECUTION_STORE, 'readwrite');
    for (const item of data.executions) {
      delete item.id;
      await tx.store.add(item);
    }
    await tx.done;
  }
  if (data.benchmarks && Array.isArray(data.benchmarks)) {
    const tx = db.transaction(BENCHMARK_STORE, 'readwrite');
    for (const item of data.benchmarks) {
      delete item.id;
      await tx.store.add(item);
    }
    await tx.done;
  }
}

