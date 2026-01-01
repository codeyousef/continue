# Feature Request: Email Notification System

## Task Description

Add a complete email notification system to the e-commerce project in `../07-multi-file-project/`.

## Requirements

### 1. Create NotificationService

Create `src/services/NotificationService.ts` with the following capabilities:

```typescript
interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Attachment[];
}

interface NotificationService {
  sendEmail(notification: EmailNotification): Promise<boolean>;
  sendOrderConfirmation(orderId: string): Promise<void>;
  sendShippingUpdate(orderId: string): Promise<void>;
  sendPasswordReset(userId: string, resetToken: string): Promise<void>;
  sendWelcomeEmail(userId: string): Promise<void>;
}
```

### 2. Create Email Templates

Create `src/templates/` folder with these HTML email templates:

- `order-confirmation.html` - Order details, items, total
- `shipping-update.html` - Tracking info, estimated delivery
- `password-reset.html` - Reset link, expiry warning
- `welcome.html` - Welcome message, getting started guide

### 3. Update User Model

Add notification preferences to the User model:

```typescript
interface NotificationPreferences {
  email: {
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  sms: {
    orderUpdates: boolean;
  };
}
```

### 4. Integrate with OrderService

Update `OrderService.ts` to:

- Send order confirmation when order is created
- Send shipping notification when status changes to "shipped"
- Send delivery confirmation when status changes to "delivered"

### 5. Add Notification History

Create tracking for sent notifications:

```typescript
interface NotificationRecord {
  id: string;
  userId: string;
  type: "email" | "sms" | "push";
  template: string;
  sentAt: Date;
  status: "sent" | "delivered" | "failed" | "bounced";
  metadata?: Record<string, unknown>;
}
```

## Acceptance Criteria

- [ ] NotificationService created with all methods
- [ ] All 4 email templates exist
- [ ] User model has notification preferences
- [ ] OrderService triggers appropriate notifications
- [ ] Notification history is recorded
- [ ] Code follows existing patterns in the project
- [ ] TypeScript compiles without errors

## Hints for the Agent

1. Start by reading the existing service implementations to understand patterns
2. The User model is in `src/models/User.ts`
3. The OrderService is in `src/services/OrderService.ts`
4. Use the existing formatters for consistent output
5. Consider rate limiting for email sending

## Test Your Implementation

After implementing, the following should work:

```typescript
import { notificationService } from './services/NotificationService';
import { orderService } from './services/OrderService';

// Should automatically send email
const order = await orderService.create({...});

// Should send shipping notification
await orderService.updateStatus(order.id, 'shipped');

// Manual notification
await notificationService.sendWelcomeEmail(userId);
```
