/**
 * Modes Module Index
 *
 * Exports all execution modes and shared utilities.
 */

// Shared utilities
export {
  CACHING_PROVIDERS,
  CLOUD_PROVIDERS,
  FileCache,
  LOCAL_PROVIDERS,
  applyCachingConfig,
  getContentLimit,
  getModelCapabilities,
  smartTruncate,
  truncateContent,
  type ModelCapabilities,
} from "./model-utils.js";

// Execution modes
export { autonomousMode } from "./autonomous.js";
export { tddMode } from "./tdd.js";

// Verification system
export * from "./verification/index.js";
