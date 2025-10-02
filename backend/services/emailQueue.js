const emailService = require('./emailService');

// Simple in-memory email queue (no Redis needed for development)
class SimpleEmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(jobName, data, options = {}) {
    console.log('Adding email job to simple queue:', { jobName, correlationId: data.correlationId });
    
    const job = {
      id: Date.now() + Math.random(),
      name: jobName,
      data,
      options,
      attempts: 0,
      maxAttempts: options.attempts || 3
    };

    this.queue.push(job);
    
    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
    
    return job;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      await this.processJob(job);
    }
    
    this.processing = false;
  }

  async processJob(job) {
    const { name, data } = job;
    
    console.log('Processing email job:', { 
      jobName: name, 
      correlationId: data.correlationId 
    });

    try {
      switch (name) {
        case 'send-verification-email':
          await emailService.sendVerificationEmail(data);
          break;
        case 'send-welcome-email':
          await emailService.sendWelcomeEmail(data);
          break;
        case 'send-password-reset-email':
          await emailService.sendPasswordResetEmail(data);
          break;
        default:
          throw new Error(`Unknown email job type: ${name}`);
      }
      
      console.log('Email job completed:', { 
        jobName: name, 
        correlationId: data.correlationId 
      });
      
    } catch (error) {
      console.error('Email job failed:', {
        jobName: name,
        correlationId: data.correlationId,
        error: error.message,
        attempt: job.attempts + 1
      });
      
      job.attempts++;
      
      // Retry if under max attempts
      if (job.attempts < job.maxAttempts) {
        console.log(`Retrying email job (${job.attempts}/${job.maxAttempts}):`, name);
        setTimeout(() => {
          this.queue.push(job);
          this.processQueue();
        }, 2000 * job.attempts); // Exponential backoff
      } else {
        console.error(`Email job failed permanently after ${job.attempts} attempts:`, name);
      }
    }
  }

  // Mock methods for compatibility
  on() { /* no-op */ }
  close() { return Promise.resolve(); }
}

// Create and export the simple queue
const emailQueue = new SimpleEmailQueue();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down simple email queue...');
  await emailQueue.close();
});

module.exports = emailQueue;
