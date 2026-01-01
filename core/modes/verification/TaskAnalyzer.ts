/**
 * Task Analyzer
 *
 * Analyzes user instructions to extract success criteria for verification.
 * Uses pattern matching and LLM assistance to understand what "success" means.
 */

import {
  ModelCapabilities,
  getContentLimit,
  smartTruncate,
} from "../model-utils.js";
import {
  PatternCriteria,
  StructuralChange,
  SuccessCriteria,
  TaskType,
} from "./types.js";

// ============================================================================
// PATTERN DATABASES
// ============================================================================

/**
 * Known anti-patterns that should be eliminated for various task types
 */
const ANTI_PATTERNS: Record<string, PatternCriteria[]> = {
  callback_hell: [
    {
      description: "Deeply nested callbacks (3+ levels)",
      patterns: [
        // Match callback pyramid patterns
        "\\)\\s*=>\\s*\\{[^}]*\\)\\s*=>\\s*\\{[^}]*\\)\\s*=>\\s*\\{",
        "function\\s*\\([^)]*\\)\\s*\\{[^}]*function\\s*\\([^)]*\\)\\s*\\{[^}]*function",
        // Callback parameters
        ",\\s*\\(err,?\\s*\\w*\\)\\s*=>",
        ",\\s*function\\s*\\(err",
      ],
      critical: true,
    },
    {
      description: "Callback-style error handling",
      patterns: ["if\\s*\\(err\\)\\s*return\\s*callback", "callback\\(err"],
      critical: false,
    },
  ],
  promise_chain: [
    {
      description: "Long .then() chains (3+ levels)",
      patterns: ["\\.then\\([^)]+\\)\\.then\\([^)]+\\)\\.then"],
      critical: true,
    },
  ],
  var_usage: [
    {
      description: "var keyword (should use let/const)",
      patterns: ["\\bvar\\s+\\w+"],
      critical: true,
    },
  ],
  any_type: [
    {
      description: "TypeScript any type",
      patterns: [":\\s*any\\b", "<any>", "as\\s+any"],
      critical: true,
    },
  ],
  console_log: [
    {
      description: "console.log statements",
      patterns: ["console\\.log\\("],
      critical: false,
    },
  ],
};

/**
 * Positive patterns that should be introduced for various task types
 */
const POSITIVE_PATTERNS: Record<string, PatternCriteria[]> = {
  async_await: [
    {
      description: "async function declarations",
      patterns: ["async\\s+function", "async\\s*\\(", "async\\s+\\w+\\s*\\("],
      critical: true,
    },
    {
      description: "await expressions",
      patterns: ["await\\s+\\w+"],
      critical: true,
    },
  ],
  promise_all: [
    {
      description: "Promise.all for parallel operations",
      patterns: ["Promise\\.all\\(", "Promise\\.allSettled\\("],
      critical: false,
    },
  ],
  try_catch: [
    {
      description: "try-catch error handling",
      patterns: ["try\\s*\\{[\\s\\S]*\\}\\s*catch"],
      critical: false,
    },
  ],
  type_annotations: [
    {
      description: "TypeScript type annotations",
      patterns: [":\\s*(?!any)\\w+(?:<[^>]+>)?(?:\\s*\\|\\s*\\w+)*"],
      critical: false,
    },
  ],
};

/**
 * Task type detection patterns
 */
const TASK_TYPE_KEYWORDS: Record<TaskType, string[]> = {
  refactor: [
    "refactor",
    "rewrite",
    "convert",
    "modernize",
    "clean up",
    "restructure",
    "callback hell",
    "async/await",
    "promise",
  ],
  bug_fix: [
    "fix",
    "bug",
    "error",
    "issue",
    "broken",
    "doesn't work",
    "not working",
    "crash",
    "exception",
    "undefined",
    "null",
  ],
  feature_add: [
    "add",
    "create",
    "implement",
    "new feature",
    "build",
    "develop",
    "introduce",
  ],
  optimization: [
    "optimize",
    "performance",
    "speed up",
    "faster",
    "efficient",
    "memory",
    "reduce",
  ],
  cleanup: [
    "remove",
    "delete",
    "clean",
    "unused",
    "dead code",
    "lint",
    "format",
  ],
  unknown: [],
};

// ============================================================================
// TASK ANALYZER
// ============================================================================

export class TaskAnalyzer {
  /**
   * Analyze user instruction to extract success criteria
   */
  static analyze(instruction: string, fileContent?: string): SuccessCriteria {
    const taskType = this.detectTaskType(instruction);
    const patternsToEliminate = this.findPatternsToEliminate(
      instruction,
      fileContent,
    );
    const patternsToIntroduce = this.findPatternsToIntroduce(instruction);
    const structuralChanges = this.detectStructuralChanges(instruction);
    const errorsToFix = this.extractErrorsToFix(instruction, fileContent);
    const successDescription = this.generateSuccessDescription(
      instruction,
      taskType,
      patternsToEliminate,
      patternsToIntroduce,
    );

    return {
      taskType,
      patternsToEliminate,
      patternsToIntroduce,
      structuralChanges,
      errorsToFix,
      successDescription,
    };
  }

  /**
   * Detect the type of task from the instruction
   */
  private static detectTaskType(instruction: string): TaskType {
    const lower = instruction.toLowerCase();

    for (const [type, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
      if (type === "unknown") continue;
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return type as TaskType;
        }
      }
    }

    return "unknown";
  }

  /**
   * Find anti-patterns that should be eliminated based on instruction
   */
  private static findPatternsToEliminate(
    instruction: string,
    fileContent?: string,
  ): PatternCriteria[] {
    const patterns: PatternCriteria[] = [];
    const lower = instruction.toLowerCase();

    // Check for callback hell specifically
    if (
      lower.includes("callback") ||
      lower.includes("pyramid") ||
      lower.includes("nested")
    ) {
      patterns.push(...ANTI_PATTERNS.callback_hell);
    }

    // Check for promise chain refactoring
    if (lower.includes("promise") && lower.includes("chain")) {
      patterns.push(...ANTI_PATTERNS.promise_chain);
    }

    // Check for var to let/const
    if (
      lower.includes("var") ||
      lower.includes("let") ||
      lower.includes("const")
    ) {
      patterns.push(...ANTI_PATTERNS.var_usage);
    }

    // Check for any type removal
    if (lower.includes("any") || lower.includes("type")) {
      patterns.push(...ANTI_PATTERNS.any_type);
    }

    // If we have file content, detect existing anti-patterns
    if (fileContent) {
      const detectedPatterns = this.detectAntiPatternsInCode(fileContent);
      for (const pattern of detectedPatterns) {
        if (!patterns.some((p) => p.description === pattern.description)) {
          patterns.push(pattern);
        }
      }
    }

    return patterns;
  }

  /**
   * Detect anti-patterns present in code
   */
  private static detectAntiPatternsInCode(code: string): PatternCriteria[] {
    const detected: PatternCriteria[] = [];

    for (const antiPatterns of Object.values(ANTI_PATTERNS)) {
      for (const pattern of antiPatterns) {
        for (const regex of pattern.patterns) {
          try {
            if (new RegExp(regex, "g").test(code)) {
              detected.push(pattern);
              break; // Found this pattern, move to next
            }
          } catch {
            // Invalid regex, skip
          }
        }
      }
    }

    return detected;
  }

  /**
   * Find positive patterns that should be introduced
   */
  private static findPatternsToIntroduce(
    instruction: string,
  ): PatternCriteria[] {
    const patterns: PatternCriteria[] = [];
    const lower = instruction.toLowerCase();

    // async/await conversion
    if (
      lower.includes("async") ||
      lower.includes("await") ||
      lower.includes("callback")
    ) {
      patterns.push(...POSITIVE_PATTERNS.async_await);
    }

    // Promise.all for parallel operations
    if (lower.includes("parallel") || lower.includes("concurrent")) {
      patterns.push(...POSITIVE_PATTERNS.promise_all);
    }

    // Error handling improvements
    if (
      lower.includes("error handling") ||
      lower.includes("try") ||
      lower.includes("catch")
    ) {
      patterns.push(...POSITIVE_PATTERNS.try_catch);
    }

    // Type annotations
    if (lower.includes("type") && !lower.includes("remove")) {
      patterns.push(...POSITIVE_PATTERNS.type_annotations);
    }

    return patterns;
  }

  /**
   * Detect expected structural changes
   */
  private static detectStructuralChanges(
    instruction: string,
  ): StructuralChange[] {
    const changes: StructuralChange[] = [];
    const lower = instruction.toLowerCase();

    // Function signature changes (callback to async)
    if (lower.includes("async") || lower.includes("callback")) {
      changes.push({
        type: "function_signature",
        description: "Convert callback-based functions to async functions",
        indicator: "async function",
      });
    }

    // Import changes for promisified APIs
    if (lower.includes("fs") || lower.includes("promise")) {
      changes.push({
        type: "import_added",
        description: "Add promise-based imports",
        indicator: "fs/promises",
      });
    }

    return changes;
  }

  /**
   * Extract specific errors mentioned in the instruction
   */
  private static extractErrorsToFix(
    instruction: string,
    fileContent?: string,
  ): string[] {
    const errors: string[] = [];

    // Look for quoted error messages
    const quotedErrors = instruction.match(/"([^"]+error[^"]+)"/gi);
    if (quotedErrors) {
      errors.push(...quotedErrors.map((e) => e.replace(/"/g, "")));
    }

    // Look for TypeScript errors (TS####)
    const tsErrors = instruction.match(/TS\d{4}/g);
    if (tsErrors) {
      errors.push(...tsErrors);
    }

    return errors;
  }

  /**
   * Generate a human-readable success description
   */
  private static generateSuccessDescription(
    instruction: string,
    taskType: TaskType,
    patternsToEliminate: PatternCriteria[],
    patternsToIntroduce: PatternCriteria[],
  ): string {
    const parts: string[] = [];

    parts.push(`Task type: ${taskType}`);

    if (patternsToEliminate.length > 0) {
      parts.push(
        `Should eliminate: ${patternsToEliminate.map((p) => p.description).join(", ")}`,
      );
    }

    if (patternsToIntroduce.length > 0) {
      parts.push(
        `Should introduce: ${patternsToIntroduce.map((p) => p.description).join(", ")}`,
      );
    }

    parts.push(`Original instruction: "${instruction}"`);

    return parts.join("\n");
  }

  /**
   * Generate a detailed verification prompt for LLM-based checking
   * @param criteria - Success criteria for the task
   * @param beforeCode - Code before changes
   * @param afterCode - Code after changes
   * @param modelCapabilities - Optional model capabilities for context limits
   */
  static generateVerificationPrompt(
    criteria: SuccessCriteria,
    beforeCode: string,
    afterCode: string,
    modelCapabilities?: ModelCapabilities,
  ): string {
    // Use model-aware content limits
    const contentLimit = modelCapabilities
      ? getContentLimit(modelCapabilities, "context")
      : 3000; // Default for backwards compatibility

    const truncatedBefore = smartTruncate(beforeCode, contentLimit);
    const truncatedAfter = smartTruncate(afterCode, contentLimit);

    return `You are verifying if a code change successfully accomplished its goal.

## Original Task
${criteria.successDescription}

## Code BEFORE:
\`\`\`
${truncatedBefore}
\`\`\`

## Code AFTER:
\`\`\`
${truncatedAfter}
\`\`\`

## Verification Checklist
${criteria.patternsToEliminate.map((p) => `- [ ] ELIMINATED: ${p.description}`).join("\n")}
${criteria.patternsToIntroduce.map((p) => `- [ ] INTRODUCED: ${p.description}`).join("\n")}

## Your Analysis
1. Did the change accomplish the goal? (YES/NO)
2. What percentage complete is the fix? (0-100%)
3. What specific issues remain unfixed?
4. What specific improvements were made?

Respond in this exact format:
ACCOMPLISHED: [YES/NO]
COMPLETION: [0-100]%
REMAINING_ISSUES:
- [issue 1]
- [issue 2]
IMPROVEMENTS_MADE:
- [improvement 1]
- [improvement 2]
SUGGESTIONS:
- [suggestion for completing the task]`;
  }
}
