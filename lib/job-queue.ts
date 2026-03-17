/**
 * Simple Job Queue Service
 * Manages deployment jobs for background processing
 *
 * For production, use: Bull, RabbitMQ, or AWS SQS
 * This is a basic in-memory implementation
 */

export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  status: "pending" | "processing" | "completed" | "failed";
  retries: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  result?: unknown;
  error?: string;
}

export interface JobProcessor<T = unknown> {
  (job: Job<T>): Promise<void>;
}

export class JobQueue {
  private jobs = new Map<string, Job>();
  private processors = new Map<string, JobProcessor<any>>();
  private processingJobs = new Set<string>();
  private registeredTypes = new Set<string>();
  private isRunning = false;
  private processInterval: NodeJS.Timeout | null = null;

  /**
   * Register a job processor
   */
  registerProcessor<T = unknown>(type: string, processor: JobProcessor<T>): void {
    this.processors.set(type, processor as JobProcessor<any>);
    this.registeredTypes.add(type);
  }

  /**
   * Check if processor type is registered
   */
  isProcessorRegistered(type: string): boolean {
    return this.registeredTypes.has(type);
  }

  /**
   * Add a job to the queue
   */
  addJob<T>(type: string, data: T, maxRetries = 3): string {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const job: Job<T> = {
      id: jobId,
      type,
      data,
      status: "pending",
      retries: 0,
      maxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, job);

    // Auto-start processing if not running
    if (!this.isRunning) {
      this.start();
    }

    return jobId;
  }

  /**
   * Get a job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all pending jobs
   */
  getPendingJobs(): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.status === "pending");
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Process jobs every 100ms
    this.processInterval = setInterval(() => {
      this.processNextJob();
    }, 100);
  }

  /**
   * Stop processing jobs
   */
  stop(): void {
    this.isRunning = false;

    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Process the next pending job
   */
  private async processNextJob(): Promise<void> {
    const pendingJobs = this.getPendingJobs();

    for (const job of pendingJobs) {
      if (this.processingJobs.has(job.id)) continue; // Already processing

      const processor = this.processors.get(job.type);
      if (!processor) {
        job.status = "failed";
        job.error = `No processor registered for job type: ${job.type}`;
        job.updatedAt = new Date();
        continue;
      }

      try {
        this.processingJobs.add(job.id);
        job.status = "processing";
        job.updatedAt = new Date();

        await processor(job);

        job.status = "completed";
        job.updatedAt = new Date();
        this.processingJobs.delete(job.id);
      } catch (error) {
        job.retries++;
        job.error = error instanceof Error ? error.message : String(error);
        job.updatedAt = new Date();

        if (job.retries >= job.maxRetries) {
          job.status = "failed";
        } else {
          job.status = "pending";
        }

        this.processingJobs.delete(job.id);
      }
    }
  }

  /**
   * Wait for a job to complete
   */
  async waitForJob(jobId: string, timeout = 60000): Promise<Job | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const job = this.getJob(jobId);

      if (!job) return null;

      if (job.status === "completed" || job.status === "failed") {
        return job;
      }

      // Wait 100ms before checking again
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Job ${jobId} did not complete within ${timeout}ms`);
  }

  /**
   * Get queue stats
   */
  getStats() {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: Array.from(this.processingJobs).length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
    };
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): number {
    let count = 0;

    for (const [jobId, job] of this.jobs) {
      if (job.status === "completed" || job.status === "failed") {
        this.jobs.delete(jobId);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all jobs
   */
  clearAll(): void {
    this.jobs.clear();
    this.processingJobs.clear();
  }
}

// Global singleton job queue instance
let globalJobQueue: JobQueue | null = null;

export function getGlobalJobQueue(): JobQueue {
  if (!globalJobQueue) {
    globalJobQueue = new JobQueue();
  }
  return globalJobQueue;
}

export default JobQueue;
