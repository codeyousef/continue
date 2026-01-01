// REFACTOR ME: God class with too many responsibilities - violates Single Responsibility Principle

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: "admin" | "user" | "moderator";
  createdAt: Date;
  lastLogin?: Date;
  preferences: Record<string, any>;
}

interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
  status: string;
}

// GOD CLASS: Does user management, authentication, orders, emails, reporting, and caching
// Should be split into: UserService, AuthService, OrderService, EmailService, ReportService, CacheService
class ApplicationManager {
  private users: Map<string, User> = new Map();
  private orders: Map<string, Order> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: Date }> =
    new Map();
  private cache: Map<string, { data: any; expiresAt: Date }> = new Map();
  private emailQueue: Array<{ to: string; subject: string; body: string }> = [];

  // ========== USER MANAGEMENT (should be UserService) ==========

  createUser(email: string, name: string, password: string): User {
    const id = `user_${Date.now()}`;
    const hashedPassword = this.hashPassword(password);

    const user: User = {
      id,
      email,
      name,
      password: hashedPassword,
      role: "user",
      createdAt: new Date(),
      preferences: {},
    };

    this.users.set(id, user);
    this.sendWelcomeEmail(email, name);
    this.logActivity("user_created", { userId: id });
    this.invalidateCache("users_list");

    return user;
  }

  updateUser(userId: string, updates: Partial<User>): User | null {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    this.logActivity("user_updated", { userId, updates });
    this.invalidateCache(`user_${userId}`);

    return updatedUser;
  }

  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    this.users.delete(userId);
    this.sendAccountDeletedEmail(user.email);
    this.logActivity("user_deleted", { userId });
    this.invalidateCache("users_list");
    this.invalidateCache(`user_${userId}`);

    return true;
  }

  getUserById(userId: string): User | null {
    const cached = this.getFromCache(`user_${userId}`);
    if (cached) return cached;

    const user = this.users.get(userId) || null;
    if (user) {
      this.setCache(`user_${userId}`, user, 300);
    }
    return user;
  }

  // ========== AUTHENTICATION (should be AuthService) ==========

  login(email: string, password: string): string | null {
    const user = Array.from(this.users.values()).find((u) => u.email === email);
    if (!user) return null;

    if (!this.verifyPassword(password, user.password)) {
      this.logActivity("login_failed", { email });
      return null;
    }

    const sessionToken = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    this.sessions.set(sessionToken, { userId: user.id, expiresAt });
    this.users.set(user.id, { ...user, lastLogin: new Date() });
    this.logActivity("login_success", { userId: user.id });

    return sessionToken;
  }

  logout(sessionToken: string): void {
    const session = this.sessions.get(sessionToken);
    if (session) {
      this.logActivity("logout", { userId: session.userId });
      this.sessions.delete(sessionToken);
    }
  }

  validateSession(sessionToken: string): User | null {
    const session = this.sessions.get(sessionToken);
    if (!session) return null;

    if (session.expiresAt < new Date()) {
      this.sessions.delete(sessionToken);
      return null;
    }

    return this.getUserById(session.userId);
  }

  private hashPassword(password: string): string {
    // Simple hash (should use bcrypt in real app)
    return Buffer.from(password).toString("base64");
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // ========== ORDER MANAGEMENT (should be OrderService) ==========

  createOrder(userId: string, items: Order["items"]): Order | null {
    const user = this.getUserById(userId);
    if (!user) return null;

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const order: Order = {
      id: `order_${Date.now()}`,
      userId,
      items,
      total,
      status: "pending",
    };

    this.orders.set(order.id, order);
    this.sendOrderConfirmationEmail(user.email, order);
    this.logActivity("order_created", { orderId: order.id, userId });

    return order;
  }

  updateOrderStatus(orderId: string, status: string): Order | null {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = status;
    this.orders.set(orderId, order);

    const user = this.getUserById(order.userId);
    if (user) {
      this.sendOrderStatusEmail(user.email, order);
    }

    this.logActivity("order_updated", { orderId, status });
    return order;
  }

  getOrdersByUser(userId: string): Order[] {
    return Array.from(this.orders.values()).filter((o) => o.userId === userId);
  }

  // ========== EMAIL (should be EmailService) ==========

  private sendWelcomeEmail(email: string, name: string): void {
    this.emailQueue.push({
      to: email,
      subject: "Welcome!",
      body: `Hello ${name}, welcome to our platform!`,
    });
    this.processEmailQueue();
  }

  private sendAccountDeletedEmail(email: string): void {
    this.emailQueue.push({
      to: email,
      subject: "Account Deleted",
      body: "Your account has been deleted.",
    });
    this.processEmailQueue();
  }

  private sendOrderConfirmationEmail(email: string, order: Order): void {
    this.emailQueue.push({
      to: email,
      subject: `Order Confirmation #${order.id}`,
      body: `Your order for $${order.total} has been received.`,
    });
    this.processEmailQueue();
  }

  private sendOrderStatusEmail(email: string, order: Order): void {
    this.emailQueue.push({
      to: email,
      subject: `Order Update #${order.id}`,
      body: `Your order status is now: ${order.status}`,
    });
    this.processEmailQueue();
  }

  private processEmailQueue(): void {
    while (this.emailQueue.length > 0) {
      const email = this.emailQueue.shift()!;
      console.log(`Sending email to ${email.to}: ${email.subject}`);
      // In real app, would send via SMTP
    }
  }

  // ========== REPORTING (should be ReportService) ==========

  generateUserReport(): { totalUsers: number; byRole: Record<string, number> } {
    const users = Array.from(this.users.values());
    const byRole: Record<string, number> = {};

    for (const user of users) {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
    }

    return { totalUsers: users.length, byRole };
  }

  generateOrderReport(): {
    totalOrders: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  } {
    const orders = Array.from(this.orders.values());
    const byStatus: Record<string, number> = {};
    let totalRevenue = 0;

    for (const order of orders) {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;
      if (order.status === "completed") {
        totalRevenue += order.total;
      }
    }

    return { totalOrders: orders.length, totalRevenue, byStatus };
  }

  // ========== CACHING (should be CacheService) ==========

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (cached.expiresAt < new Date()) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  // ========== LOGGING (should be LogService) ==========

  private logActivity(action: string, data: Record<string, any>): void {
    console.log(
      `[${new Date().toISOString()}] ${action}:`,
      JSON.stringify(data),
    );
    // In real app, would write to log file or logging service
  }
}

export { ApplicationManager };
