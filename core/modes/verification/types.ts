/**
 * Verification System Types
 *
 * Types for autonomous mode self-verification to ensure tasks are
 * actually accomplished before marking them complete.
 */

export interface SuccessCriteria {
  /** Task type being performed */
  taskType: TaskType;
  /** Patterns that should be eliminated (e.g., nested callbacks) */
  patternsToEliminate: PatternCriteria[];
  /** Patterns that should be introduced (e.g., async/await) */
  patternsToIntroduce: PatternCriteria[];
  /** Expected structural changes */
  structuralChanges: StructuralChange[];
  /** Error conditions that should be resolved */
  errorsToFix: string[];
  /** Free-form success description for LLM verification */
  successDescription: string;
}

export type TaskType =
  | "refactor"
  | "bug_fix"
  | "feature_add"
  | "optimization"
  | "cleanup"
  | "unknown";

export interface PatternCriteria {
  /** Human-readable description */
  description: string;
  /** Regex or keyword patterns to detect */
  patterns: string[];
  /** Whether this is critical (must pass) or advisory */
  critical: boolean;
}

export interface StructuralChange {
  /** Type of structural change */
  type:
    | "function_signature"
    | "import_added"
    | "export_added"
    | "class_modified";
  /** Description of the change */
  description: string;
  /** What to look for */
  indicator: string;
}

export interface VerificationResult {
  /** Overall pass/fail */
  passed: boolean;
  /** Confidence score 0-1 */
  confidence: number;
  /** Detailed results per criterion */
  criteriaResults: CriterionResult[];
  /** Summary for user/LLM */
  summary: string;
  /** Suggestions for improvement if failed */
  suggestions: string[];
  /** Errors found in the code (from diagnostics) */
  diagnosticErrors: string[];
}

export interface CriterionResult {
  /** Name of the criterion */
  name: string;
  /** Pass/fail for this criterion */
  passed: boolean;
  /** Explanation of why it passed/failed */
  explanation: string;
  /** Evidence (code snippets, line numbers) */
  evidence: string[];
}

export interface FileSnapshot {
  /** File path */
  path: string;
  /** Content before changes */
  beforeContent: string;
  /** Content after changes */
  afterContent: string;
  /** Hash for quick comparison */
  beforeHash: string;
  afterHash: string;
}

export interface VerificationContext {
  /** Original user instruction */
  instruction: string;
  /** Extracted success criteria */
  criteria: SuccessCriteria;
  /** File snapshots for comparison */
  snapshots: Map<string, FileSnapshot>;
  /** Start time for tracking */
  startTime: number;
  /** Current verification attempt */
  attempt: number;
  /** Max attempts allowed */
  maxAttempts: number;
  /** Previous verification results (for iterative refinement) */
  previousResults: VerificationResult[];
}
