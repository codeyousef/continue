// ProductService - business logic for product operations

import {
  CreateProductInput,
  Product,
  ProductSearchFilters,
  UpdateProductInput,
  generateSlug,
  getTotalStock,
  isInStock,
} from "../models/Product";

// Simulated database
const products: Map<string, Product> = new Map();

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export class ProductService {
  async create(input: CreateProductInput): Promise<Product> {
    const now = new Date();
    const id = `prod_${Date.now()}`;

    const product: Product = {
      id,
      vendorId: input.vendorId,
      name: input.name,
      slug: generateSlug(input.name),
      description: input.description,
      shortDescription: input.shortDescription,
      category: input.category,
      tags: input.tags || [],
      status: "draft",
      variants: input.variants.map((v, i) => ({
        ...v,
        id: `var_${id}_${i}`,
      })),
      images: [],
      rating: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    products.set(id, product);
    return product;
  }

  async findById(id: string): Promise<Product | null> {
    return products.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    for (const product of products.values()) {
      if (product.slug === slug) {
        return product;
      }
    }
    return null;
  }

  async search(
    filters: ProductSearchFilters,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Product>> {
    let results = Array.from(products.values()).filter(
      (p) => p.status === "active",
    );

    // Apply filters
    if (filters.category) {
      results = results.filter((p) => p.category === filters.category);
    }

    if (filters.vendorId) {
      results = results.filter((p) => p.vendorId === filters.vendorId);
    }

    if (filters.inStock) {
      results = results.filter((p) => isInStock(p));
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((p) =>
        p.variants.some((v) => v.price >= filters.minPrice!),
      );
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((p) =>
        p.variants.some((v) => v.price <= filters.maxPrice!),
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter((p) =>
        filters.tags!.some((tag) => p.tags.includes(tag)),
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Paginate
    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const data = results.slice(startIndex, startIndex + limit);

    return { data, total, page, totalPages };
  }

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.findById(id);
    if (!product) {
      throw new Error("Product not found");
    }

    if (input.name !== undefined) {
      product.name = input.name;
      product.slug = generateSlug(input.name);
    }
    if (input.description !== undefined)
      product.description = input.description;
    if (input.shortDescription !== undefined)
      product.shortDescription = input.shortDescription;
    if (input.category !== undefined) product.category = input.category;
    if (input.tags !== undefined) product.tags = input.tags;
    if (input.status !== undefined) product.status = input.status;

    product.updatedAt = new Date();
    products.set(id, product);

    return product;
  }

  async updateStock(
    productId: string,
    variantId: string,
    quantity: number,
  ): Promise<Product> {
    const product = await this.findById(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error("Variant not found");
    }

    variant.stock = Math.max(0, variant.stock + quantity);

    // Auto-update status if out of stock
    if (getTotalStock(product) === 0 && product.status === "active") {
      product.status = "out_of_stock";
    }

    product.updatedAt = new Date();
    products.set(productId, product);

    return product;
  }

  async delete(id: string): Promise<boolean> {
    return products.delete(id);
  }

  async getByVendor(vendorId: string): Promise<Product[]> {
    return Array.from(products.values()).filter((p) => p.vendorId === vendorId);
  }
}

export const productService = new ProductService();
