import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';

// ─── Redis channel names ────────────────────────────────────────────────────
export const REDIS_CHANNELS = {
  NOTIFICATIONS: 'notifications',
  BOOKING_UPDATES: 'booking:updates',
  RESOURCE_UPDATES: 'resource:updates',
  SLA_VIOLATIONS: 'sla:violations',
} as const;

export type NotificationPayload = {
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
};

/**
 * NotificationService
 *
 * Delivers notifications via two channels:
 *   1. Redis Pub/Sub  – broadcasts to any subscriber (e.g. a WebSocket gateway)
 *   2. Redis Lists    – persists the last 100 notifications per user for inbox retrieval
 */
@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private readonly INBOX_MAX = 100; // max stored notifications per user

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    // Subscribe to the general notifications channel and log incoming messages
    await this.redisService.subscribe(REDIS_CHANNELS.NOTIFICATIONS, (raw) => {
      try {
        const payload: NotificationPayload = JSON.parse(raw);
        this.logger.log(
          `📬 Notification received [${payload.type}] for user ${payload.userId}: ${payload.message}`,
        );
      } catch {
        this.logger.warn(`Malformed notification payload: ${raw}`);
      }
    });
  }

  // ─── Core send helper ──────────────────────────────────────────────────────

  private async sendNotificationPayload(
    channel: string,
    payload: NotificationPayload,
  ): Promise<void> {
    // 1. Publish over Redis Pub/Sub so WebSocket gateways or other services receive it
    await this.redisService.publish(channel, payload);

    // 2. Persist to a per-user inbox list in Redis
    const inboxKey = `inbox:${payload.userId}`;
    await this.redisService.lPush(inboxKey, JSON.stringify(payload));
    await this.redisService.lTrim(inboxKey, 0, this.INBOX_MAX - 1); // keep latest N
    await this.redisService.expire(inboxKey, 60 * 60 * 24 * 7); // TTL: 7 days
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  async sendNotification(
    userId: string,
    message: string,
    type = 'info',
    data?: Record<string, unknown>,
  ): Promise<void> {
    const payload: NotificationPayload = {
      userId,
      type,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    await this.sendNotificationPayload(REDIS_CHANNELS.NOTIFICATIONS, payload);
    this.logger.log(`Sent notification to user ${userId}: ${message}`);
  }

  async sendBookingUpdate(
    userId: string,
    bookingId: string,
    status: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    const payload: NotificationPayload = {
      userId,
      type: 'booking:update',
      message: `Booking ${bookingId} status changed to ${status}`,
      data: { bookingId, status, ...extra },
      timestamp: new Date().toISOString(),
    };
    await this.sendNotificationPayload(REDIS_CHANNELS.BOOKING_UPDATES, payload);
  }

  async sendResourceUpdate(
    userId: string,
    resourceId: number,
    event: string,
    extra?: Record<string, unknown>,
  ): Promise<void> {
    const payload: NotificationPayload = {
      userId,
      type: 'resource:update',
      message: `Resource #${resourceId}: ${event}`,
      data: { resourceId, event, ...extra },
      timestamp: new Date().toISOString(),
    };
    await this.sendNotificationPayload(REDIS_CHANNELS.RESOURCE_UPDATES, payload);
  }

  async sendSLAAlert(
    userId: string,
    resourceId: number,
    violations: string[],
  ): Promise<void> {
    const payload: NotificationPayload = {
      userId,
      type: 'sla:violation',
      message: `SLA violation on resource #${resourceId}: ${violations.join(', ')}`,
      data: { resourceId, violations },
      timestamp: new Date().toISOString(),
    };
    await this.sendNotificationPayload(REDIS_CHANNELS.SLA_VIOLATIONS, payload);
    this.logger.warn(`SLA alert for resource #${resourceId}: ${violations.join(', ')}`);
  }

  // ─── Inbox retrieval ───────────────────────────────────────────────────────

  async getInbox(userId: string, limit = 20): Promise<NotificationPayload[]> {
    const inboxKey = `inbox:${userId}`;
    const raw = await this.redisService.lRange(inboxKey, 0, limit - 1);
    return raw.map((item) => JSON.parse(item) as NotificationPayload);
  }

  // ─── Legacy stubs (kept for backward-compat) ───────────────────────────────

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}: ${subject}`);
    // TODO: Implement SMTP/SES email sending
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    this.logger.log(`Sending SMS to ${phoneNumber}: ${message}`);
    // TODO: Implement SMS provider logic
  }
}
