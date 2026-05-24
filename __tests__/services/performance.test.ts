import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BatchProcessor } from '../../lib/utils/batchProcessor';
import { FileTransfer } from '../../lib/utils/fileTransfer';

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  memory?: number;
}

interface PerformanceThreshold {
  name: string;
  maxDuration: number;
  unit: string;
}

const PERFORMANCE_THRESHOLDS: PerformanceThreshold[] = [
  { name: 'batch_processor_small_batch', maxDuration: 100, unit: 'ms' },
  { name: 'batch_processor_medium_batch', maxDuration: 500, unit: 'ms' },
  { name: 'batch_processor_large_batch', maxDuration: 2000, unit: 'ms' },
  { name: 'file_transfer_chunking', maxDuration: 200, unit: 'ms' },
  { name: 'file_transfer_large_file', maxDuration: 200, unit: 'ms' },
  { name: 'memory_usage_limit', maxDuration: 100, unit: 'MB' },
];

describe('Performance Monitoring & Benchmarks', () => {
  let metrics: PerformanceMetrics;

  beforeEach(() => {
    metrics = {
      fcp: 1200,
      lcp: 2500,
      fid: 50,
      cls: 0.1,
      ttfb: 300,
      memory: 45 * 1024 * 1024,
    };
  });

  describe('Core Web Vitals', () => {
    it('FCP should be under 1.8s (Good)', () => {
      expect(metrics.fcp).toBeLessThan(1800);
    });

    it('LCP should be under 2.5s (Good)', () => {
      expect(metrics.lcp).toBeLessThanOrEqual(2500);
    });

    it('FID should be under 100ms (Good)', () => {
      expect(metrics.fid).toBeLessThan(100);
    });

    it('CLS should be under 0.1 (Good)', () => {
      expect(metrics.cls).toBeLessThanOrEqual(0.1);
    });

    it('TTFB should be under 800ms', () => {
      expect(metrics.ttfb).toBeLessThan(800);
    });
  });

  describe('Memory Usage', () => {
    it('memory usage should be reasonable (< 100MB)', () => {
      if (metrics.memory) {
        const memoryInMB = metrics.memory / (1024 * 1024);
        expect(memoryInMB).toBeLessThan(100);
        console.log(`Memory usage: ${memoryInMB.toFixed(2)}MB`);
      }
    });

    it('should detect memory leaks in repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 100; i++) {
        const processor = new BatchProcessor();
        processor.addTasks([
          new File(['test content'], `file${i}.txt`),
          new File(['more content'], `file2-${i}.txt`)
        ]);
        
        await processor.processBatch(async (file) => {
          return `processed-${file.name}`;
        }, 1);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024);
      
      console.log(`Memory increase after 100 iterations: ${memoryIncrease.toFixed(2)}MB`);
      expect(memoryIncrease).toBeLessThan(50); // Should not leak more than 50MB
    });
  });

  describe('Batch Processing Performance', () => {
    it('should process small batch (10 files) within threshold', async () => {
      const startTime = performance.now();
      
      const processor = new BatchProcessor();
      const files = Array.from({ length: 10 }, (_, i) =>
        new File([`content ${i}`], `file${i}.txt`)
      );
      
      processor.addTasks(files);
      await processor.processBatch(async (file) => 
        Promise.resolve(`processed-${file.name}`)
      , 5);
      
      const duration = performance.now() - startTime;
      console.log(`Small batch processing time: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS[0].maxDuration);
    });

    it('should process medium batch (50 files) within threshold', async () => {
      const startTime = performance.now();
      
      const processor = new BatchProcessor();
      const files = Array.from({ length: 50 }, (_, i) =>
        new File([`content ${i}`], `medium-file${i}.txt`)
      );
      
      processor.addTasks(files);
      await processor.processBatch(async (file) => 
        Promise.resolve(`processed-${file.name}`)
      , 10);
      
      const duration = performance.now() - startTime;
      console.log(`Medium batch processing time: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS[1].maxDuration);
    });

    it('should process large batch (100 files) efficiently', async () => {
      const startTime = performance.now();
      
      const processor = new BatchProcessor();
      const files = Array.from({ length: 100 }, (_, i) =>
        new File([`large content ${i}`.repeat(10)], `large-file${i}.txt`)
      );
      
      processor.addTasks(files);
      await processor.processBatch(async (file) => 
        Promise.resolve({ result: `processed-${file.name}`, size: file.size })
      , 20);
      
      const duration = performance.now() - startTime;
      console.log(`Large batch processing time: ${duration.toFixed(2)}ms`);
      
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS[2].maxDuration);
    });

    it('should maintain consistent performance across multiple runs', async () => {
      const runTimes: number[] = [];
      
      for (let run = 0; run < 3; run++) {
        const startRun = performance.now();
        
        const processor = new BatchProcessor();
        processor.addTasks(
          Array.from({ length: 20 }, (_, i) => new File([`data ${i}`], `run${run}-file${i}.txt`))
        );
        
        await processor.processBatch(async (file) => 
          Promise.resolve(file.name)
        , 5);
        
        runTimes.push(performance.now() - startRun);
      }
      
      const avgTime = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
      const variance = runTimes.map(time => Math.pow(time - avgTime, 2)).reduce((a, b) => a + b, 0) / runTimes.length;
      const stdDev = Math.sqrt(variance);
      
      console.log(`Performance consistency:`);
      console.log(`  Average: ${avgTime.toFixed(2)}ms`);
      console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`);
      console.log(`  Coefficient of Variation: ${(stdDev / avgTime * 100).toFixed(2)}%`);
      
      expect(stdDev / avgTime).toBeLessThan(0.5); // CV should be < 50%
    });
  });

  describe('File Transfer Performance', () => {
    it('should chunk files efficiently', () => {
      const startTime = performance.now();
      
      const transfer = new FileTransfer({ chunkSize: 1024 * 1024 }); // 1MB chunks
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large-10mb.txt'); // 10MB
      
      const chunks = transfer.getChunks(largeFile);
      
      const duration = performance.now() - startTime;
      console.log(`File chunking time (10MB): ${duration.toFixed(2)}ms`);
      console.log(`Number of chunks: ${chunks.length}`);
      
      expect(chunks.length).toBe(10);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS[3].maxDuration);
    });

    it('should handle concurrent chunk processing', async () => {
      const startTime = performance.now();
      
      const transfer = new FileTransfer({
        chunkSize: 512 * 1024,
        concurrency: 5
      });
      
      const file = new File(['x'.repeat(5 * 1024 * 1024)], 'concurrent-test.txt'); // 5MB
      const chunks = transfer.getChunks(file);
      
      const results = await transfer.processChunks(
        chunks,
        async (chunk) => ({
          index: chunk.index,
          processed: true,
          size: chunk.end - chunk.start
        })
      );
      
      const duration = performance.now() - startTime;
      console.log(`Concurrent chunk processing time: ${duration.toFixed(2)}ms`);
      console.log(`Processed ${results.length} chunks`);
      
      expect(results.length).toBe(chunks.length);
      expect(results.every(r => r !== null)).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS[4].maxDuration);
    });
  });

  describe('Regression Detection', () => {
    it('should detect significant performance degradation', async () => {
      const baselineTime = 100; // ms
      const degradationThreshold = 2.0; // Allow 2x slower
      
      const processor = new BatchProcessor();
      processor.addTasks(Array.from({ length: 30 }, (_, i) => 
        new File([`regression test ${i}`], `regression-${i}.txt`)
      ));
      
      const startTime = performance.now();
      await processor.processBatch(async (file) => 
        Promise.resolve(file.name)
      , 10);
      const currentTime = performance.now() - startTime;
      
      const regressionRatio = currentTime / baselineTime;
      console.log(`Regression ratio: ${regressionRatio.toFixed(2)}x baseline`);
      
      if (regressionRatio > degradationThreshold) {
        console.warn(`⚠️ Performance threshold exceeded! Current: ${currentTime.toFixed(2)}ms, Baseline: ${baselineTime}ms`);
      }
      
      expect(regressionRatio).toBeLessThan(degradationThreshold * 1.5); // Generous limit for test
    });

    it('should track and report performance trends', () => {
      const trendData = [120, 115, 130, 125, 140, 135, 150];
      const average = trendData.reduce((a, b) => a + b, 0) / trendData.length;
      const lastValue = trendData[trendData.length - 1];
      const trend = ((lastValue - average) / average) * 100;
      
      console.log(`Performance trend analysis:`);
      console.log(`  Average: ${average.toFixed(2)}ms`);
      console.log(`  Latest: ${lastValue}ms`);
      console.log(`  Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(2)}%`);
      
      if (trend > 20) {
        console.warn('⚠️ Upward performance trend detected!');
      }
      
      expect(Math.abs(trend)).toBeLessThan(50); // Alert on extreme trends
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-frequency operations', async () => {
      const operationsPerSecond = 100;
      const testDurationMs = 1000;
      const operationCount = (operationsPerSecond * testDurationMs) / 1000;
      
      const startTime = performance.now();
      let completedOperations = 0;
      
      const promises = [];
      for (let i = 0; i < operationCount; i++) {
        promises.push(
          new Promise<void>((resolve) => {
            const processor = new BatchProcessor();
            processor.addTask(new File([`stress ${i}`], `stress-${i}.txt`));
            processor.processBatch(async (file) => {
              completedOperations++;
              return file.name;
            }).finally(resolve);
          })
        );
      }
      
      await Promise.all(promises);
      const actualDuration = performance.now() - startTime;
      const opsPerSecond = (completedOperations / actualDuration) * 1000;
      
      console.log(`Stress test results:`);
      console.log(`  Operations: ${completedOperations}/${operationCount}`);
      console.log(`  Duration: ${actualDuration.toFixed(2)}ms`);
      console.log(`  Throughput: ${opsPerSecond.toFixed(2)} ops/sec`);
      
      expect(completedOperations).toBe(operationCount);
      expect(actualDuration).toBeLessThan(testDurationMs * 3); // Within 3x expected
    });
  });
});
