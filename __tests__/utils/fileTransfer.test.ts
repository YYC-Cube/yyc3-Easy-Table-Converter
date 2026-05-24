import { FileTransfer, DEFAULT_CHUNK_CONFIG } from '@/lib/utils/fileTransfer';

describe('FileTransfer', () => {
  let transfer: FileTransfer;

  beforeEach(() => {
    transfer = new FileTransfer();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const t = new FileTransfer();
      expect(t).toBeInstanceOf(FileTransfer);
    });
  });

  describe('getChunks', () => {
    it('should split file into chunks based on chunkSize', () => {
      const file = new File(['x'.repeat(10000)], 'test.txt');
      transfer = new FileTransfer({ chunkSize: 2000 });
      
      const chunks = transfer.getChunks(file);
      expect(chunks.length).toBe(5);
    });

    it('should return single chunk for small files', () => {
      const file = new File(['small'], 'small.txt');
      const chunks = transfer.getChunks(file);
      expect(chunks.length).toBe(1);
    });

    it('should handle empty files', () => {
      const file = new File([], 'empty.txt');
      const chunks = transfer.getChunks(file);
      expect(chunks.length).toBe(0);
    });

    it('should support startFrom for resume', () => {
      const file = new File(['x'.repeat(10000)], 'test.txt');
      transfer = new FileTransfer({ chunkSize: 2000 });
      const chunks = transfer.getChunks(file, 4000);
      expect(chunks.length).toBe(3);
      expect(chunks[0].start).toBe(4000);
    });
  });

  describe('readFileChunk', () => {
    it('should read file chunk as ArrayBuffer', async () => {
      const content = 'Test content';
      const file = new File([content], 'test.txt');
      const buffer = await transfer.readFileChunk(file, 0, file.size);
      expect(buffer).toBeInstanceOf(ArrayBuffer);
      expect(buffer.byteLength).toBe(content.length);
    });
  });

  describe('processChunks', () => {
    it('should process all chunks successfully', async () => {
      const file = new File(['x'.repeat(1000)], 'test.txt');
      transfer = new FileTransfer({ chunkSize: 200 });
      const chunks = transfer.getChunks(file);
      const results = await transfer.processChunks(
        chunks,
        async (chunk) => `processed-${chunk.index}`
      );
      expect(results.length).toBe(chunks.length);
    });

    it('should call progress callback', async () => {
      const file = new File(['x'.repeat(600)], 'test.txt');
      transfer = new FileTransfer({ chunkSize: 200 });
      const chunks = transfer.getChunks(file);
      const progressCalls: number[] = [];
      
      await transfer.processChunks(
        chunks,
        async (chunk) => chunk.index,
        (progress) => progressCalls.push(progress)
      );
      
      expect(progressCalls[progressCalls.length - 1]).toBe(100);
    });

    it('should throw after max retries exceeded', async () => {
      const file = new File(['x'.repeat(200)], 'test.txt');
      transfer = new FileTransfer({ 
        chunkSize: 200, 
        maxRetries: 1,
        retryDelay: 10
      });
      
      const chunks = transfer.getChunks(file);
      
      await expect(transfer.processChunks(
        chunks,
        async () => { throw new Error('Persistent failure'); }
      )).rejects.toThrow();
    });

    it('should handle empty chunks array', async () => {
      const results = await transfer.processChunks(
        [],
        async (chunk) => chunk.index
      );
      expect(results).toEqual([]);
    });
  });

  describe('simulateChunckedUpload', () => {
    it('should process file and return result', async () => {
      const file = new File(['x'.repeat(400)], 'test.txt');
      transfer = new FileTransfer({ chunkSize: 200, retryDelay: 10 });
      const result = await transfer.simulateChunckedUpload(file);
      expect(result).toBeInstanceOf(Blob);
    });
  });

  describe('calculateTransferStats', () => {
    it('should calculate speed and remaining time', () => {
      const startTime = Date.now() - 5000;
      const stats = transfer.calculateTransferStats(1000000, startTime, 3000000);
      expect(stats.speed).toBeGreaterThan(0);
      expect(stats.remainingTime).toBeGreaterThan(0);
    });

    it('should return zeros when no data uploaded', () => {
      const startTime = Date.now();
      const stats = transfer.calculateTransferStats(0, startTime, 1000);
      expect(stats.speed).toBe(0);
      expect(stats.remainingTime).toBe(0);
    });
  });

  describe('DEFAULT_CHUNK_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CHUNK_CONFIG.chunkSize).toBe(5 * 1024 * 1024);
      expect(DEFAULT_CHUNK_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_CHUNK_CONFIG.retryDelay).toBe(2000);
      expect(DEFAULT_CHUNK_CONFIG.concurrency).toBe(3);
    });
  });
});