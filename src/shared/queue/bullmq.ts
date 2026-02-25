import { Queue, Worker, QueueEvents, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

let _connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!_connection) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    _connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
  }
  return _connection;
}

export function getConnectionOptions(): ConnectionOptions {
  return getRedisConnection();
}

// Queue names
export const QUEUE_NAMES = {
  SUBCONTRACTOR_ESCALATION: 'subcontractor-escalation',
  NOTIFICATIONS: 'notifications',
  EMAIL_PARSE: 'email-parse',
} as const;

// Singleton queues
const queues: Map<string, Queue> = new Map();

export function getQueue(name: string): Queue {
  if (!queues.has(name)) {
    queues.set(name, new Queue(name, { connection: getConnectionOptions() }));
  }
  return queues.get(name)!;
}

export { Queue, Worker, QueueEvents };
