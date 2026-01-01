/**
 * Model Utilities
 *
 * Shared utilities for model detection, capabilities, and cost-saving configurations.
 * Used across all execution modes (autonomous, TDD, verification, etc.)
 */

import { IDE } from "..";

// ============================================================================
// MODEL DETECTION & COST-SAVING CONFIGURATIONS
// ============================================================================

// Cloud providers that have high context limits and support caching
export const CLOUD_PROVIDERS = [
  "anthropic",
  "openai",
  "azure",
  "gemini",
  "deepseek",
  "groq",
  "mistral",
  "together",
  "openrouter",
  "bedrock",
  "vertex",
];

// Local providers that need GPU protection
export const LOCAL_PROVIDERS = [
  "ollama",
  "lmstudio",
  "llamacpp",
  "vllm",
  "jan",
];

// Providers that support prompt caching
export const CACHING_PROVIDERS = [
  "anthropic",
  "openrouter",
  "bedrock",
  "vertex",
];

export interface ModelCapabilities {
  isCloud: boolean;
  isLocal: boolean;
  supportsCaching: boolean;
  maxContextTokens: number;
  maxOutputTokens: number;
  safeContextBuffer: number;
}

/**
 * Detect model capabilities based on provider
 */
export function getModelCapabilities(model: any): ModelCapabilities {
  const providerName = model?.providerName?.toLowerCase() || "";
  const modelName = model?.model?.toLowerCase() || "";

  const isCloud = CLOUD_PROVIDERS.includes(providerName);
  const isLocal = LOCAL_PROVIDERS.includes(providerName) || !isCloud;
  const supportsCaching = CACHING_PROVIDERS.includes(providerName);

  // Cloud models: use generous limits
  // Local models: conservative limits to protect GPU
  if (isCloud) {
    // Claude models: 200k context, reserve 10k for output
    if (providerName === "anthropic" || modelName.includes("claude")) {
      return {
        isCloud: true,
        isLocal: false,
        supportsCaching: true,
        maxContextTokens: 190000,
        maxOutputTokens: 8192,
        safeContextBuffer: 10000,
      };
    }
    // GPT-4 Turbo / GPT-4o: 128k context
    if (
      modelName.includes("gpt-4") &&
      (modelName.includes("turbo") || modelName.includes("4o"))
    ) {
      return {
        isCloud: true,
        isLocal: false,
        supportsCaching: false, // OpenAI doesn't support our caching strategy
        maxContextTokens: 120000,
        maxOutputTokens: 4096,
        safeContextBuffer: 8000,
      };
    }
    // DeepSeek: 64k context (cost-effective)
    if (providerName === "deepseek" || modelName.includes("deepseek")) {
      return {
        isCloud: true,
        isLocal: false,
        supportsCaching: false,
        maxContextTokens: 60000,
        maxOutputTokens: 8192,
        safeContextBuffer: 4000,
      };
    }
    // Default cloud: 32k context (safe assumption)
    return {
      isCloud: true,
      isLocal: false,
      supportsCaching,
      maxContextTokens: 30000,
      maxOutputTokens: 4096,
      safeContextBuffer: 2000,
    };
  }

  // Local models: strict limits for GPU protection (4090 safety profile)
  return {
    isCloud: false,
    isLocal: true,
    supportsCaching: false,
    maxContextTokens: 8192, // Conservative for 24GB VRAM
    maxOutputTokens: 2048,
    safeContextBuffer: 1024,
  };
}

/**
 * Apply prompt caching configuration for cloud providers
 */
export function applyCachingConfig(model: any): void {
  const capabilities = getModelCapabilities(model);

  if (capabilities.supportsCaching) {
    // Enable aggressive caching for cost savings
    if (!model.cacheBehavior) {
      model.cacheBehavior = {};
    }
    model.cacheBehavior.cacheSystemMessage = true;
    model.cacheBehavior.cacheConversation = true;

    // Also enable via completion options
    if (!model.completionOptions) {
      model.completionOptions = {};
    }
    model.completionOptions.promptCaching = true;
  }
}

// ============================================================================
// FILE CACHE
// ============================================================================

/**
 * Cost-saving: File content cache to avoid redundant reads
 */
export class FileCache {
  private cache = new Map<string, { content: string; timestamp: number }>();
  private readonly TTL = 30000; // 30 second TTL

  async get(ide: IDE, filePath: string): Promise<string | null> {
    const cached = this.cache.get(filePath);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.content;
    }
    return null;
  }

  set(filePath: string, content: string): void {
    this.cache.set(filePath, { content, timestamp: Date.now() });
  }

  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  /**
   * Read file with caching - avoids redundant reads
   */
  async readFile(ide: IDE, filePath: string): Promise<string> {
    const cached = await this.get(ide, filePath);
    if (cached !== null) {
      return cached;
    }

    try {
      const content = await ide.readFile(filePath);
      this.set(filePath, content);
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }
}

// ============================================================================
// CONTEXT LIMIT HELPERS
// ============================================================================

/**
 * Get appropriate content limit based on model capabilities
 */
export function getContentLimit(
  capabilities: ModelCapabilities,
  contentType: "file" | "context" | "output",
): number {
  if (capabilities.isCloud) {
    switch (contentType) {
      case "file":
        return 10000; // 10k chars for file content
      case "context":
        return 20000; // 20k chars for context
      case "output":
        return capabilities.maxOutputTokens * 4; // Approximate chars
    }
  } else {
    // Local models: conservative limits
    switch (contentType) {
      case "file":
        return 4000; // 4k chars for file content
      case "context":
        return 6000; // 6k chars for context
      case "output":
        return capabilities.maxOutputTokens * 4;
    }
  }
}

/**
 * Truncate content to fit within limits
 */
export function truncateContent(
  content: string,
  maxLength: number,
  addEllipsis: boolean = true,
): string {
  if (content.length <= maxLength) {
    return content;
  }

  const truncated = content.slice(0, maxLength);
  if (addEllipsis) {
    return truncated + "\n... (truncated)";
  }
  return truncated;
}

/**
 * Smart truncation that preserves important parts (start and end)
 */
export function smartTruncate(
  content: string,
  maxLength: number,
  preserveRatio: number = 0.3, // Preserve 30% at start, 30% at end
): string {
  if (content.length <= maxLength) {
    return content;
  }

  const preserveLength = Math.floor(maxLength * preserveRatio);
  const start = content.slice(0, preserveLength);
  const end = content.slice(-preserveLength);
  const omittedLines = content
    .slice(preserveLength, -preserveLength)
    .split("\n").length;

  return `${start}\n\n... (${omittedLines} lines omitted) ...\n\n${end}`;
}
