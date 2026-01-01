// API Controller - REST endpoints for the e-commerce system
// This demonstrates cross-file imports and API patterns

import { CreateOrderInput, OrderStatus } from "../models/Order";
import { CreateProductInput, ProductCategory } from "../models/Product";
import { CreateUserInput, User, UserRole } from "../models/User";
import { orderService } from "../services/OrderService";
import { productService } from "../services/ProductService";
import { userService } from "../services/UserService";

// Simulated request/response types
interface Request<T = unknown> {
  body: T;
  params: Record<string, string>;
  query: Record<string, string>;
  user?: { id: string; role: UserRole };
}

interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => void;
  send: (data: string) => void;
}

// Middleware types
type Handler = (req: Request, res: Response) => Promise<void>;

// Error handler wrapper
const asyncHandler = (fn: Handler): Handler => {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal server error";
      res.status(500).json({ error: message });
    }
  };
};

// ============ USER ENDPOINTS ============

export const createUser = asyncHandler(
  async (req: Request<CreateUserInput>, res) => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  },
);

export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.status(200).json(user);
});

export const login = asyncHandler(
  async (req: Request<{ email: string; password: string }>, res) => {
    const { email, password } = req.body;
    const user = await userService.authenticate(email, password);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    // In real app, would generate JWT token here
    res.status(200).json({ user, token: `fake-jwt-${user.id}` });
  },
);

export const updateUserProfile = asyncHandler(
  async (req: Request<Partial<User>>, res) => {
    const user = await userService.update(req.params.id, req.body);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(200).json(user);
  },
);

// ============ PRODUCT ENDPOINTS ============

export const createProduct = asyncHandler(
  async (req: Request<CreateProductInput>, res) => {
    // Only admin can create products
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const product = await productService.create(req.body);
    res.status(201).json(product);
  },
);

export const getProduct = asyncHandler(async (req, res) => {
  const product = await productService.findById(req.params.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.status(200).json(product);
});

export const searchProducts = asyncHandler(async (req, res) => {
  const {
    query,
    category,
    minPrice,
    maxPrice,
    page,
    pageSize,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await productService.search({
    query,
    category: category as ProductCategory,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    page: page ? parseInt(page) : 1,
    pageSize: pageSize ? parseInt(pageSize) : 20,
    sortBy: (sortBy as "price" | "name" | "createdAt") || "createdAt",
    sortOrder: (sortOrder as "asc" | "desc") || "desc",
  });

  res.status(200).json(result);
});

export const updateProductStock = asyncHandler(
  async (req: Request<{ variantId: string; delta: number }>, res) => {
    // Only admin can update stock
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const { variantId, delta } = req.body;
    const product = await productService.updateStock(
      req.params.id,
      variantId,
      delta,
    );

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.status(200).json(product);
  },
);

// ============ ORDER ENDPOINTS ============

export const createOrder = asyncHandler(
  async (req: Request<CreateOrderInput>, res) => {
    // Ensure user can only create orders for themselves
    if (req.user?.id !== req.body.userId) {
      res.status(403).json({ error: "Cannot create order for another user" });
      return;
    }

    const order = await orderService.create(req.body);
    res.status(201).json(order);
  },
);

export const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.findById(req.params.id);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Users can only view their own orders (unless admin)
  if (req.user?.id !== order.userId && req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.status(200).json(order);
});

export const getUserOrders = asyncHandler(async (req, res) => {
  // Users can only view their own orders (unless admin)
  if (req.user?.id !== req.params.userId && req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const orders = await orderService.findByUser(req.params.userId);
  res.status(200).json(orders);
});

export const updateOrderStatus = asyncHandler(
  async (req: Request<{ status: OrderStatus }>, res) => {
    // Only admin can update order status
    if (req.user?.role !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const order = await orderService.updateStatus(
      req.params.id,
      req.body.status,
    );
    res.status(200).json(order);
  },
);

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.findById(req.params.id);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Users can only cancel their own orders
  if (req.user?.id !== order.userId && req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const cancelledOrder = await orderService.cancel(req.params.id);
  res.status(200).json(cancelledOrder);
});

// ============ ROUTE DEFINITIONS ============

export const routes = {
  // User routes
  "POST /users": createUser,
  "GET /users/:id": getUser,
  "POST /auth/login": login,
  "PUT /users/:id": updateUserProfile,

  // Product routes
  "POST /products": createProduct,
  "GET /products/:id": getProduct,
  "GET /products": searchProducts,
  "PATCH /products/:id/stock": updateProductStock,

  // Order routes
  "POST /orders": createOrder,
  "GET /orders/:id": getOrder,
  "GET /users/:userId/orders": getUserOrders,
  "PATCH /orders/:id/status": updateOrderStatus,
  "POST /orders/:id/cancel": cancelOrder,
};
