/**
 * Verification Engine
 *
 * Performs post-execution verification to ensure tasks were actually accomplished.
 * Uses multiple strategies: pattern matching, structural analysis, and LLM verification.
 */

import {
  VerificationResult,
  VerificationContext,
  SuccessCriteria,
  CriterionResult,
  FileSnapshot,
  PatternCriteria,
} from "./types.js";
import { TaskAnalyzer } from "./TaskAnalyzer.js";

export interface VerificationOptions {
  /** Use LLM for semantic verification (more thorough but slower) */
  useLLM?: boolean;
  /** Minimum confidence to pass */
  minConfidence?: number;
  /** Include diagnostic errors in verification */
  checkDiagnostics?: boolean;
}

const DEFAULT_OPTIONS: VerificationOptions = {
  useLLM: true,
  minConfidence: 0.7,
  checkDiagnostics: true,
};

export class VerificationEngine {
  private options: VerificationOptions;

  constructor(options: Partial<VerificationOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Verify that changes accomplished the task
   */
  async verify(
    context: VerificationContext,
    getDiagnostics?: () => Promise<string[]>,
    llmVerify?: (prompt: string) => Promise<string>,
  ): Promise<VerificationResult> {
    const criteriaResults: CriterionResult[] = [];
    let diagnosticErrors: string[] = [];

    // Step 1: Check pattern elimination
    for (const snapshot of context.snapshots.values()) {
      const eliminationResults = this.checkPatternElimination(
        context.criteria.patternsToEliminate,
        snapshot.beforeContent,
        snapshot.afterContent,
        snapshot.path,
      );
      criteriaResults.push(...eliminationResults);
    }

    // Step 2: Check pattern introduction
    for (const snapshot of context.snapshots.values()) {
      const introductionResults = this.checkPatternIntroduction(
        context.criteria.patternsToIntroduce,
        snapshot.afterContent,
        snapshot.path,
      );
      criteriaResults.push(...introductionResults);
    }

    // Step 3: Check diagnostics if enabled
    if (this.options.checkDiagnostics && getDiagnostics) {
      diagnosticErrors = await getDiagnostics();
      criteriaResults.push(this.checkDiagnosticErrors(diagnosticErrors));
    }

    // Step 4: Check if file actually changed
    for (const snapshot of context.snapshots.values()) {
      criteriaResults.push(this.checkFileChanged(snapshot));
    }

    // Step 5: LLM verification for semantic correctness
    let llmResult: CriterionResult | null = null;
    if (this.options.useLLM && llmVerify) {
      for (const snapshot of context.snapshots.values()) {
        const prompt = TaskAnalyzer.generateVerificationPrompt(
          context.criteria,
          snapshot.beforeContent,
          snapshot.afterContent,
        );
        const llmResponse = await llmVerify(prompt);
        llmResult = this.parseLLMVerificationResponse(llmResponse);
        criteriaResults.push(llmResult);
      }
    }

    // Calculate overall result
    const criticalResults = criteriaResults.filter(
      (r) =>
        context.criteria.patternsToEliminate.some(
          (p) => p.critical && r.name.includes(p.description),
        ) ||
        context.criteria.patternsToIntroduce.some(
          (p) => p.critical && r.name.includes(p.description),
        ),
    );

    const criticalPassed =
      criticalResults.length === 0 || criticalResults.every((r) => r.passed);

    const passedCount = criteriaResults.filter((r) => r.passed).length;
    const confidence =
      criteriaResults.length > 0 ? passedCount / criteriaResults.length : 0;

    const passed =
      criticalPassed && confidence >= (this.options.minConfidence || 0.7);

    // Generate summary and suggestions
    const summary = this.generateSummary(criteriaResults, passed, confidence);
    const suggestions = this.generateSuggestions(
      criteriaResults,
      context.criteria,
    );

    return {
      passed,
      confidence,
      criteriaResults,
      summary,
      suggestions,
      diagnosticErrors,
    };
  }

  /**
   * Check if anti-patterns were eliminated
   */
  private checkPatternElimination(
    patterns: PatternCriteria[],
    beforeContent: string,
    afterContent: string,
    filePath: string,
  ): CriterionResult[] {
    const results: CriterionResult[] = [];

    for (const pattern of patterns) {
      let beforeCount = 0;
      let afterCount = 0;
      const evidence: string[] = [];

      for (const regex of pattern.patterns) {
        try {
          const re = new RegExp(regex, "g");
          const beforeMatches = beforeContent.match(re) || [];
          const afterMatches = afterContent.match(re) || [];
          beforeCount += beforeMatches.length;
          afterCount += afterMatches.length;

          if (afterMatches.length > 0) {
            // Find line numbers of remaining matches
            const lines = afterContent.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (new RegExp(regex).test(lines[i])) {
                evidence.push(`Line ${i + 1}: ${lines[i].trim().slice(0, 60)}`);
              }
            }
          }
        } catch {
          // Invalid regex, skip
        }
      }

      const eliminated = afterCount === 0 || afterCount < beforeCount * 0.3;
      const improvement =
        beforeCount > 0
          ? Math.round((1 - afterCount / beforeCount) * 100)
          : 100;

      results.push({
        name: `Eliminate: ${pattern.description}`,
        passed: eliminated,
        explanation: eliminated
          ? `Successfully eliminated (${beforeCount} → ${afterCount})`
          : `Still present: ${afterCount} occurrences remain (${improvement}% reduction)`,
        evidence,
      });
    }

    return results;
  }

  /**
   * Check if positive patterns were introduced
   */
  private checkPatternIntroduction(
    patterns: PatternCriteria[],
    afterContent: string,
    filePath: string,
  ): CriterionResult[] {
    const results: CriterionResult[] = [];

    for (const pattern of patterns) {
      let found = false;
      const evidence: string[] = [];

      for (const regex of pattern.patterns) {
        try {
          const re = new RegExp(regex, "g");
          const matches = afterContent.match(re) || [];
          if (matches.length > 0) {
            found = true;
            // Find example occurrences
            const lines = afterContent.split("\n");
            for (let i = 0; i < lines.length && evidence.length < 3; i++) {
              if (new RegExp(regex).test(lines[i])) {
                evidence.push(`Line ${i + 1}: ${lines[i].trim().slice(0, 60)}`);
              }
            }
          }
        } catch {
          // Invalid regex, skip
        }
      }

      results.push({
        name: `Introduce: ${pattern.description}`,
        passed: found,
        explanation: found
          ? `Found ${evidence.length}+ occurrences`
          : `Not found in modified code`,
        evidence,
      });
    }

    return results;
  }

  /**
   * Check diagnostic errors
   */
  private checkDiagnosticErrors(errors: string[]): CriterionResult {
    const passed = errors.length === 0;
    return {
      name: "No diagnostic errors",
      passed,
      explanation: passed
        ? "No compile/lint errors detected"
        : `${errors.length} errors found`,
      evidence: errors.slice(0, 5), // First 5 errors
    };
  }

  /**
   * Check if file actually changed
   */
  private checkFileChanged(snapshot: FileSnapshot): CriterionResult {
    const changed = snapshot.beforeHash !== snapshot.afterHash;
    const contentChanged = snapshot.beforeContent !== snapshot.afterContent;

    return {
      name: `File modified: ${snapshot.path}`,
      passed: changed && contentChanged,
      explanation: changed
        ? "File was modified"
        : "File was NOT modified - no changes applied",
      evidence: [],
    };
  }

  /**
   * Parse LLM verification response
   */
  private parseLLMVerificationResponse(response: string): CriterionResult {
    const accomplishedMatch = response.match(/ACCOMPLISHED:\s*(YES|NO)/i);
    const completionMatch = response.match(/COMPLETION:\s*(\d+)%/i);
    const issuesMatch = response.match(
      /REMAINING_ISSUES:\n([\s\S]*?)(?=IMPROVEMENTS_MADE:|$)/i,
    );

    const accomplished = accomplishedMatch?.[1]?.toUpperCase() === "YES";
    const completion = completionMatch ? parseInt(completionMatch[1]) : 0;
    const issues =
      issuesMatch?.[1]
        ?.split("\n")
        .filter((l) => l.trim().startsWith("-"))
        .map((l) => l.replace(/^-\s*/, "").trim())
        .filter(Boolean) || [];

    return {
      name: "LLM semantic verification",
      passed: accomplished && completion >= 80,
      explanation: `${completion}% complete. ${accomplished ? "Task accomplished." : "Task NOT accomplished."}`,
      evidence: issues,
    };
  }

  /**
   * Generate summary of verification results
   */
  private generateSummary(
    results: CriterionResult[],
    passed: boolean,
    confidence: number,
  ): string {
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    if (passed) {
      return (
        `✅ Verification PASSED (${Math.round(confidence * 100)}% confidence)\n` +
        `${passedCount}/${results.length} criteria met`
      );
    } else {
      const failures = results
        .filter((r) => !r.passed)
        .map((r) => `- ${r.name}: ${r.explanation}`)
        .join("\n");
      return (
        `❌ Verification FAILED (${Math.round(confidence * 100)}% confidence)\n` +
        `${passedCount}/${results.length} criteria met\n\nFailed criteria:\n${failures}`
      );
    }
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(
    results: CriterionResult[],
    criteria: SuccessCriteria,
  ): string[] {
    const suggestions: string[] = [];
    const failedResults = results.filter((r) => !r.passed);

    for (const result of failedResults) {
      if (result.name.includes("Eliminate")) {
        suggestions.push(
          `Continue removing: ${result.name.replace("Eliminate: ", "")}. ` +
            `${result.evidence.length} instances remain.`,
        );
      } else if (result.name.includes("Introduce")) {
        suggestions.push(
          `Add missing pattern: ${result.name.replace("Introduce: ", "")}`,
        );
      } else if (result.name.includes("diagnostic")) {
        suggestions.push(
          `Fix compile errors: ${result.evidence.slice(0, 2).join(", ")}`,
        );
      } else if (result.name.includes("modified")) {
        suggestions.push(
          `File was not modified - ensure the edit was actually applied`,
        );
      } else if (result.name.includes("LLM")) {
        suggestions.push(...result.evidence.map((e) => `Address: ${e}`));
      }
    }

    return suggestions;
  }

  /**
   * Create a file snapshot for tracking changes
   */
  static createSnapshot(path: string, content: string): Partial<FileSnapshot> {
    return {
      path,
      beforeContent: content,
      beforeHash: this.hashContent(content),
    };
  }

  /**
   * Complete a snapshot with after content
   */
  static completeSnapshot(
    snapshot: Partial<FileSnapshot>,
    afterContent: string,
  ): FileSnapshot {
    return {
      path: snapshot.path!,
      beforeContent: snapshot.beforeContent!,
      afterContent,
      beforeHash: snapshot.beforeHash!,
      afterHash: this.hashContent(afterContent),
    };
  }

  /**
   * Simple hash function for content comparison
   */
  private static hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
}
