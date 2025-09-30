const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const emailService = require('./emailService');

// Redis connection - using environment variable or default
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});

// Handle Redis connection errors gracefully
redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisConnection.on('connect', () => {
  console.log('Redis connected successfully');
});

// Email queue
const emailQueue = new Queue('email', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Email worker
const emailWorker = new Worker('email', async (job) => {
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
      error: error.message
    });
    throw error;
  }
}, {
  connection: redisConnection,
  concurrency: 5,
});

// Queue event listeners
emailQueue.on('completed', (job) => {
  console.log('Email job completed:', { jobId: job.id });
});

emailQueue.on('failed', (job, err) => {
  console.error('Email job failed:', { jobId: job.id, error: err.message });
});

emailWorker.on('completed', (job) => {
  console.log('Email worker completed job:', { jobId: job.id });
});

emailWorker.on('failed', (job, err) => {
  console.error('Email worker failed:', { jobId: job.id, error: err.message });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down email queue and worker...');
  await emailWorker.close();
  await emailQueue.close();
  await redisConnection.quit();
});

module.exports = emailQueue;