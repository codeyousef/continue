import { ChatMessage, IDE } from "..";
import { ConfigHandler } from "../config/ConfigHandler";
import {
  applyCachingConfig,
  FileCache,
  getContentLimit,
  getModelCapabilities,
  truncateContent,
} from "./model-utils.js";

// Node.js modules - imported at top level for stability
import * as fs from "node:fs/promises";
import * as path from "node:path";

interface TestResult {
  passed: boolean;
  output: string;
  exitCode: number;
}

/** TDD Phase states */
type TDDPhase = "red" | "green" | "refactor" | "complete";

/** State extracted from conversation history */
interface TDDState {
  phase: TDDPhase;
  requirement: string;
  testCode: string;
  implCode: string;
  framework: TestFramework | null;
}

/** Maximum iterations to prevent infinite loops - reduced for local models */
const MAX_ITERATIONS = 15;

/** Iterations before suggesting a different model for local LLMs */
const LOCAL_MODEL_WARNING_THRESHOLD = 10;

/**
 * Build a test command that runs only tests for a specific module.
 * For Rust, this filters to only run tests in the specified module.
 */
function buildTestCommand(
  framework: TestFramework,
  testFilename: string,
): string {
  if (framework.language === "rust") {
    // Extract module name from filename (e.g., "src/my_module.rs" -> "my_module")
    const moduleName = path.basename(testFilename, ".rs");
    // Run tests that start with this module name followed by ::
    // Using the format "module::tests::" ensures we don't match other modules
    // that happen to contain similar substrings (e.g., "test" won't match "tdd_test")
    // We use --nocapture to see println! output for debugging
    // Note: Rust test filters are substring matches, so "add_numbers::tests::" will
    // only match tests in add_numbers module, not tests in other modules
    return `cargo test --lib "${moduleName}::tests::" -- --nocapture`;
  }
  if (framework.language === "python") {
    // Run only tests in the specific file
    return `pytest ${testFilename} -v`;
  }
  if (framework.language === "go") {
    // Run tests in the specific file
    const dir = path.dirname(testFilename) || ".";
    return `go test -v ./${dir}/...`;
  }
  // Default: use framework's command
  return framework.command;
}

/**
 * Execute a shell command using IDE subprocess and capture output
 */
async function executeCommand(
  ide: IDE,
  command: string,
  cwd: string,
): Promise<TestResult> {
  try {
    // Use IDE's subprocess which is more stable than child_process
    const [stdout, stderr] = await ide.subprocess(command, cwd);
    const output = stdout + (stderr ? "\n" + stderr : "");

    // Determine if tests passed based on output
    const passed = detectTestsPassed(output, stderr);
    return { passed, output, exitCode: passed ? 0 : 1 };
  } catch (err: any) {
    // subprocess throws on non-zero exit
    const errorMsg = err?.message || String(err);
    // Try to extract stdout/stderr from error
    const output = errorMsg;
    return { passed: false, output, exitCode: 1 };
  }
}

/**
 * Detect if tests passed based on output content
 */
function detectTestsPassed(output: string, stderr: string): boolean {
  // Check for EXPLICIT pass indicators FIRST (before fail checks)
  // This handles cases like "0 failed" which contains "failed" but means success
  const combinedOutput = (output + " " + stderr).toLowerCase();

  // Rust-specific: "test result: ok" is definitive pass
  if (combinedOutput.includes("test result: ok")) {
    return true;
  }

  // Check for "X passed; 0 failed" pattern (Rust test output)
  if (/\d+\s*passed.*0\s*failed/.test(combinedOutput)) {
    return true;
  }

  // pytest: "X passed" without "failed" or with "0 failed"
  if (
    combinedOutput.includes("passed") &&
    !combinedOutput.match(/[1-9]\d*\s*failed/)
  ) {
    return true;
  }

  // Explicit failure indicators (check after pass indicators)
  const failIndicators = [
    "test result: failed", // Rust explicit failure
    "error[e", // Rust compile errors
    "panicked", // Rust panic
    "assertion failed", // Generic assertion
    "assertionerror", // Python assertion
    "failures:", // Rust failure list header
  ];

  for (const indicator of failIndicators) {
    if (combinedOutput.includes(indicator)) {
      return false;
    }
  }

  // Check for "N failed" where N > 0
  if (combinedOutput.match(/[1-9]\d*\s*failed/)) {
    return false;
  }

  // Fallback: if no errors and has test output, assume passed
  if (!stderr || stderr.trim() === "") {
    return true;
  }

  return false;
}

/**
 * Convert a file path to a file:// URI
 */
function pathToFileUri(filePath: string): string {
  // If already a URI, return as-is
  if (filePath.startsWith("file://") || filePath.startsWith("untitled:")) {
    return filePath;
  }
  // Convert path to file:// URI
  // Handle Windows paths (C:\...) and Unix paths (/...)
  if (filePath.match(/^[a-zA-Z]:\\/)) {
    // Windows: C:\path -> file:///C:/path
    return "file:///" + filePath.replace(/\\/g, "/");
  }
  // Unix: /path -> file:///path
  return "file://" + filePath;
}

/**
 * Write a file using IDE's writeFile (works in extension context)
 */
async function writeFileWithIde(
  ide: IDE,
  filePath: string,
  content: string,
): Promise<void> {
  const fileUri = pathToFileUri(filePath);
  console.log("[TDD] writeFileWithIde called:", {
    filePath,
    fileUri,
    contentLength: content.length,
  });
  try {
    await ide.writeFile(fileUri, content);
    console.log("[TDD] writeFile succeeded for:", fileUri);
  } catch (err) {
    console.error("[TDD] writeFile FAILED:", err);
    throw err;
  }
}

/**
 * Register a Rust module in lib.rs
 */
async function registerRustModule(
  ide: IDE,
  rootPath: string,
  moduleName: string,
): Promise<void> {
  const libPath = path.join(rootPath, "src", "lib.rs");
  let libContent = await readFileIfExists(ide, libPath);

  const modDeclaration = `pub mod ${moduleName};`;

  // Check if module is already declared
  if (
    libContent.includes(modDeclaration) ||
    libContent.includes(`mod ${moduleName};`)
  ) {
    return; // Already registered
  }

  // Add module declaration at the end
  if (libContent.trim()) {
    libContent = libContent.trimEnd() + "\n" + modDeclaration + "\n";
  } else {
    libContent = modDeclaration + "\n";
  }

  await writeFileWithIde(ide, libPath, libContent);
}

/**
 * Read a file if it exists, return empty string otherwise
 */
async function readFileIfExists(ide: IDE, filePath: string): Promise<string> {
  try {
    return await ide.readFile(filePath);
  } catch {
    return "";
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup project structure for the detected framework
 * Creates necessary config files (Cargo.toml, package.json, etc.)
 */
async function setupProjectStructure(
  rootPath: string,
  framework: TestFramework,
  projectName: string,
): Promise<{ created: string[]; errors: string[] }> {
  const created: string[] = [];
  const errors: string[] = [];

  try {
    switch (framework.language) {
      case "rust": {
        const cargoPath = path.join(rootPath, "Cargo.toml");
        if (!(await fileExists(cargoPath))) {
          const cargoContent = `[package]
name = "${projectName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase()}"
version = "0.1.0"
edition = "2021"

[dependencies]
`;
          await writeFileWithIde(ide, cargoPath, cargoContent);
          created.push("Cargo.toml");
        }
        // Create src/lib.rs for library crate
        const libPath = path.join(rootPath, "src", "lib.rs");
        if (!(await fileExists(libPath))) {
          await writeFileWithIde(ide, libPath, "// Library modules\n\n");
          created.push("src/lib.rs");
        }
        // Create tests directory for integration tests
        const testsDir = path.join(rootPath, "tests");
        await fs.mkdir(testsDir, { recursive: true });
        break;
      }
      case "go": {
        const goModPath = path.join(rootPath, "go.mod");
        if (!(await fileExists(goModPath))) {
          const goModContent = `module ${projectName.replace(/[^a-z0-9_-]/gi, "_").toLowerCase()}

go 1.21
`;
          await writeFileWithIde(ide, goModPath, goModContent);
          created.push("go.mod");
        }
        break;
      }
      case "python": {
        // Python doesn't strictly need config, but we can create a pytest.ini
        const pytestPath = path.join(rootPath, "pytest.ini");
        if (!(await fileExists(pytestPath))) {
          const pytestContent = `[pytest]
testpaths = tests
python_files = test_*.py
`;
          await writeFileWithIde(ide, pytestPath, pytestContent);
          created.push("pytest.ini");
        }
        // Create tests directory
        await fs.mkdir(path.join(rootPath, "tests"), { recursive: true });
        break;
      }
      case "typescript":
      case "javascript": {
        const pkgPath = path.join(rootPath, "package.json");
        if (!(await fileExists(pkgPath))) {
          const pkgContent = JSON.stringify(
            {
              name: projectName.replace(/[^a-z0-9_-]/gi, "-").toLowerCase(),
              version: "1.0.0",
              scripts: {
                test: framework.name.toLowerCase().includes("vitest")
                  ? "vitest"
                  : "jest",
              },
              devDependencies: framework.name.toLowerCase().includes("vitest")
                ? { vitest: "^1.0.0" }
                : { jest: "^29.0.0", "@types/jest": "^29.0.0" },
            },
            null,
            2,
          );
          await writeFileWithIde(ide, pkgPath, pkgContent);
          created.push("package.json");
        }
        break;
      }
    }
  } catch (err) {
    errors.push(`Failed to setup project: ${err}`);
  }

  return { created, errors };
}

/** Commands that trigger phase continuation */
const CONTINUE_COMMANDS = [
  "continue",
  "continnue", // Common typo
  "continue with the next cycle",
  "next",
  "next cycle",
  "proceed",
  "go",
  "go on",
  "skip",
  "done",
  "ok",
  "yes",
  "y",
];

/**
 * Check if user input is a continuation command
 */
function isContinueCommand(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  // Check exact matches
  if (CONTINUE_COMMANDS.includes(normalized)) return true;
  // Check if very short (likely a command)
  if (normalized.length <= 3) return true;
  // Check if starts with common command words
  if (normalized.startsWith("continue") || normalized.startsWith("next"))
    return true;
  return false;
}

/**
 * Extract TDD state from conversation history
 */
function extractTDDState(messages: ChatMessage[]): TDDState {
  const state: TDDState = {
    phase: "red",
    requirement: "",
    testCode: "",
    implCode: "",
    framework: null,
  };

  // DEBUG: Log all messages
  console.log("[TDD extractTDDState] Total messages:", messages.length);
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const contentPreview =
      typeof msg.content === "string"
        ? msg.content.substring(0, 200)
        : JSON.stringify(msg.content).substring(0, 200);
    console.log(
      `[TDD] Message ${i}: role=${msg.role}, content=${contentPreview}...`,
    );
  }

  // Look through assistant messages for TDD markers (in reverse to get latest)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    const content =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);

    // Skip if this message doesn't look like a TDD output
    const hasTDDMarker = content.includes("🧪 **TDD Mode");
    console.log(
      `[TDD] Checking assistant message ${i}: hasTDDMarker=${hasTDDMarker}`,
    );
    if (!hasTDDMarker) continue;

    // Check for requirement - handle multi-line content (code blocks)
    // Match from _Requirement: " to either ..."_ or just "_
    const reqMatch = content.match(/_Requirement: "([\s\S]+?)(?:\.\.\.)?"\s*_/);
    console.log(
      `[TDD] reqMatch:`,
      reqMatch ? reqMatch[1].substring(0, 50) : null,
    );
    if (reqMatch && reqMatch[1]) {
      // Don't use "continue" or other commands as the requirement
      const req = reqMatch[1].trim();
      if (!isContinueCommand(req)) {
        state.requirement = req;
      }
    }

    // Check for framework
    const fwMatch = content.match(/📋 \*\*Framework:\*\* ([^\n]+)/);
    if (fwMatch) {
      const fwName = fwMatch[1].trim();
      state.framework = inferFrameworkFromName(fwName);
    }

    // Check phases and extract code
    if (content.includes("🔴 **Phase 1: RED**")) {
      // Extract test code from RED phase
      const testMatch = content.match(
        /🔴 \*\*Phase 1: RED\*\*[\s\S]*?```[\w-]*\n([\s\S]*?)```/,
      );
      if (testMatch) {
        state.testCode = testMatch[1].trim();
      }

      // Determine current phase based on what's complete
      if (content.includes("🟢 **Phase 2: GREEN**")) {
        const implMatch = content.match(
          /🟢 \*\*Phase 2: GREEN\*\*[\s\S]*?```[\w-]*\n([\s\S]*?)```/,
        );
        if (implMatch) {
          state.implCode = implMatch[1].trim();
        }

        if (content.includes("🔵 **Phase 3: REFACTOR**")) {
          if (content.includes("✅ **TDD Cycle Complete!**")) {
            state.phase = "complete";
          } else {
            state.phase = "refactor";
          }
        } else {
          state.phase = "refactor";
        }
      } else {
        state.phase = "green";
      }

      // Found a valid TDD cycle, stop looking
      if (state.requirement) {
        break;
      }
    }
  }

  // If no requirement found, it's not a valid state
  if (!state.requirement) {
    return {
      phase: "red",
      requirement: "",
      testCode: "",
      implCode: "",
      framework: null,
    };
  }

  return state;
}

/**
 * Infer framework details from name
 */
function inferFrameworkFromName(name: string): TestFramework {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("cargo") || lowerName.includes("rust")) {
    return {
      name: "cargo test",
      command: "cargo test",
      language: "rust",
      testPattern: "*_test.rs",
    };
  }
  if (lowerName.includes("pytest") || lowerName.includes("python")) {
    return {
      name: "pytest",
      command: "pytest",
      language: "python",
      testPattern: "test_*.py",
    };
  }
  if (lowerName.includes("go test") || lowerName.includes("golang")) {
    return {
      name: "go test",
      command: "go test ./...",
      language: "go",
      testPattern: "*_test.go",
    };
  }
  if (lowerName.includes("vitest")) {
    return {
      name: "Vitest",
      command: "npx vitest",
      language: "typescript",
      testPattern: "*.test.ts",
    };
  }
  // Default to Jest
  return {
    name: "Jest",
    command: "npm test",
    language: "typescript",
    testPattern: "*.test.ts",
  };
}

/**
 * TDD Mode - Fully Automated Red-Green-Refactor cycle
 *
 * Flow:
 * 1. RED: Write a failing test, run it, verify it fails
 * 2. GREEN: Implement minimal code, run tests, iterate until pass
 * 3. REFACTOR: Clean up while keeping tests green
 *
 * This mode automatically:
 * - Creates test and implementation files
 * - Runs tests after each phase
 * - Iterates to fix failures
 */
export async function* tddMode(
  configHandler: ConfigHandler,
  ide: IDE,
  messages: ChatMessage[],
  model: any, // ILLM
): AsyncGenerator<string> {
  // Apply cost-saving configurations
  const capabilities = getModelCapabilities(model);
  applyCachingConfig(model);

  // Initialize file cache for this session
  const fileCache = new FileCache();

  const lastMessage = messages[messages.length - 1];
  const userRequest =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : "No request found";

  // Check if this is a continuation command
  const isContinuation = isContinueCommand(userRequest);

  // Extract state from previous messages
  const previousState = extractTDDState(messages.slice(0, -1));

  // Determine what to do
  if (isContinuation && previousState.requirement) {
    // User wants to continue from previous state
    yield* handleContinuation(
      model,
      capabilities,
      previousState,
      ide,
      fileCache,
    );
    return;
  }

  // If user typed a continue command but there's no previous state, show help
  if (isContinuation) {
    yield "🧪 **TDD Mode**\n\n";
    yield `⚠️ **No previous TDD cycle found to continue.**\n\n`;
    yield "To start a TDD cycle, describe what you want to implement. For example:\n";
    yield '- "Implement a function that validates email addresses"\n';
    yield '- "Create a user authentication module"\n';
    yield '- "Build a shopping cart with add/remove functionality"\n';
    return;
  }

  // New TDD cycle
  yield "🧪 **TDD Mode - Automated Red-Green-Refactor Cycle**\n\n";

  // Show model info
  const providerInfo = capabilities.isCloud ? "☁️ Cloud" : "🖥️ Local";
  const cachingInfo = capabilities.supportsCaching ? " | 💾 Caching" : "";
  yield `_Model: ${model.model || "unknown"} | ${providerInfo}${cachingInfo}_\n\n`;

  // Show requirement
  const truncatedRequest =
    userRequest.length > 100 ? userRequest.slice(0, 100) + "..." : userRequest;
  yield `_Requirement: "${truncatedRequest}"_\n\n`;

  const workspaceDirs = await ide.getWorkspaceDirs();
  let rootPath = workspaceDirs[0] || process.cwd();

  // Handle file:// protocol
  if (rootPath.startsWith("file://")) {
    rootPath = rootPath.replace("file://", "");
  }

  // Check if user referenced a specific file to fix (e.g., "@tdd_test.rs" or "src/tdd_test.rs")
  // This allows TDD mode to edit an existing file rather than creating a new one
  let targetFile: string | null = null;
  const filePatterns = [
    /```(\S+\.rs)\b/, // ```src/tdd_test.rs
    /@(\S+\.rs)\b/, // @tdd_test.rs
    /(?:fix|edit|update|modify)\s+(\S+\.rs)\b/i, // fix tdd_test.rs
    /(\S+\.rs)\s*\n/, // tdd_test.rs at start of line
    /(src\/\S+\.rs)\b/, // src/something.rs anywhere
  ];
  for (const pattern of filePatterns) {
    const match = userRequest.match(pattern);
    if (match) {
      targetFile = match[1];
      break;
    }
  }

  if (targetFile) {
    yield `🎯 **Target file:** \`${targetFile}\`\n\n`;
  }

  // Detect test framework (with caching)
  const testFramework = await detectTestFramework(
    ide,
    rootPath,
    fileCache,
    userRequest,
  );
  yield `📋 **Framework:** ${testFramework.name}\n`;
  yield `   _Command:_ \`${testFramework.command}\`\n\n`;

  // Setup project structure if needed (Cargo.toml, package.json, etc.)
  const projectName = path.basename(rootPath) || "tdd_project";
  const setupResult = await setupProjectStructure(
    rootPath,
    testFramework,
    projectName,
  );
  if (setupResult.created.length > 0) {
    yield `🔧 **Project setup:** Created ${setupResult.created.join(", ")}\n\n`;
  }
  if (setupResult.errors.length > 0) {
    yield `⚠️ **Setup warnings:** ${setupResult.errors.join(", ")}\n\n`;
  }

  // ==========================================================================
  // Phase 1: RED - Write failing test
  // ==========================================================================
  yield "## 🔴 Phase 1: RED - Writing failing test\n\n";

  // For Rust, we use unit tests (test in same file as implementation)
  const isRust = testFramework.language === "rust";

  const testPrompt = isRust
    ? `You are a TDD expert. Write a failing unit test for the following Rust requirement.

Requirement: ${userRequest}

Guidelines:
1. Write a unit test inside a #[cfg(test)] mod tests block
2. The test should call a function that doesn't exist yet
3. Include the use super::*; import
4. Use descriptive test names with #[test] attribute
5. Write properly formatted code with correct indentation

Example structure:
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_something() {
        let result = function_to_implement();
        assert_eq!(result, expected_value);
    }
}

IMPORTANT: Respond with ONLY the test module code. Do NOT include the implementation. Do NOT wrap in markdown code blocks.`
    : `You are a TDD expert. Write a failing test case for the following requirement.

Framework: ${testFramework.name}
Language: ${testFramework.language}
Requirement: ${userRequest}

Guidelines:
1. Start with the simplest test case
2. Use descriptive test names
3. Follow ${testFramework.name} conventions
4. Include assertions that will initially fail (because the implementation doesn't exist yet)
5. Write properly formatted code with correct indentation and newlines

IMPORTANT: Respond with ONLY the raw test code. Do NOT wrap it in markdown code blocks. Do NOT include any explanation or commentary.`;

  let testCode = "";
  yield "🤖 _Generating test..._\n\n";
  yield "**Generated test:**\n```" + testFramework.language + "\n";
  for await (const chunk of model.streamComplete(testPrompt)) {
    testCode += chunk;
    yield chunk;
  }
  yield "\n```\n\n";

  if (!testCode.trim()) {
    yield "❌ **Error:** Model did not generate any test code.\n";
    yield "_Try using a more capable model or simplifying the requirement._\n";
    return;
  }

  // Clean the complete output (not individual chunks)
  const cleanTestCode = stripCodeBlock(testCode);

  // Use target file if specified, otherwise generate a filename
  const testFilename = targetFile
    ? targetFile.startsWith("src/")
      ? targetFile
      : `src/${targetFile}`
    : suggestTestFilename(userRequest, testFramework);
  const fullTestPath = path.join(rootPath, testFilename);

  // For Rust, we write just the test module first (will fail to compile - that's RED!)
  // For other languages, write the test file normally
  if (isRust) {
    yield `📝 **Writing test:** \`${testFilename}\`\n`;
    try {
      // Write just the test code - this will fail to compile (RED phase)
      await writeFileWithIde(ide, fullTestPath, cleanTestCode);
      // Open the file to refresh the editor (like autonomous mode)
      await ide.openFile(pathToFileUri(fullTestPath));
      yield `✅ **${targetFile ? "Updated" : "Created"}:** \`${testFilename}\` (test only, will fail to compile)\n\n`;

      // Register the module in lib.rs
      const moduleName = path.basename(testFilename, ".rs");
      await registerRustModule(ide, rootPath, moduleName);
      yield `📦 **Registered module:** \`${moduleName}\` in lib.rs\n\n`;
    } catch (err) {
      yield `❌ **Error creating file:** ${err}\n\n`;
      yield "_Unable to continue TDD cycle without test file._\n";
      return;
    }
  } else {
    yield `📝 **Writing:** \`${testFilename}\`\n`;
    try {
      await writeFileWithIde(ide, fullTestPath, cleanTestCode);
      // Open the file to refresh the editor (like autonomous mode)
      await ide.openFile(pathToFileUri(fullTestPath));
      yield `✅ **Created:** \`${testFilename}\`\n\n`;
    } catch (err) {
      yield `❌ **Error creating file:** ${err}\n\n`;
      yield "_Unable to continue TDD cycle without test file._\n";
      return;
    }
  }

  // Build module-specific test command (especially important for Rust)
  const testCommand = buildTestCommand(testFramework, testFilename);

  // Run tests - should fail (RED phase)
  yield `🏃 **Running tests:** \`${testCommand}\`\n\n`;
  let testResult = await executeCommand(ide, testCommand, rootPath);

  yield "<details>\n<summary>Test Output (click to expand)</summary>\n\n";
  yield "```\n" + testResult.output.slice(0, 6000) + "\n```\n";
  yield "</details>\n\n";

  if (testResult.passed) {
    yield "⚠️ **Unexpected:** Test passed on first run! The test may not be properly failing.\n";
    yield "Consider reviewing the test to ensure it tests for behavior that doesn't exist yet.\n\n";
  } else {
    yield "✅ **Test fails as expected** (exit code: " +
      testResult.exitCode +
      ")\n\n";
  }

  // ==========================================================================
  // Phase 2: GREEN - Implement to pass
  // ==========================================================================
  yield "## 🟢 Phase 2: GREEN - Implementing minimal code\n\n";

  const contextLimit = getContentLimit(capabilities, "context");
  let implCode = "";
  let iteration = 0;
  const previousImplCodes: string[] = []; // Track previous implementations for repetition detection
  let hasShownLocalModelWarning = false;

  // Iterate until tests pass or we hit max iterations
  while (!testResult.passed && iteration < MAX_ITERATIONS) {
    iteration++;
    yield `### Iteration ${iteration}/${MAX_ITERATIONS}\n\n`;

    // Check if we should warn about local model capability after threshold
    if (
      !capabilities.isCloud &&
      iteration === LOCAL_MODEL_WARNING_THRESHOLD &&
      !hasShownLocalModelWarning
    ) {
      hasShownLocalModelWarning = true;
      yield "\n---\n";
      yield "⚠️ **Local Model Struggling**\n\n";
      yield `After ${LOCAL_MODEL_WARNING_THRESHOLD} iterations, tests are still failing. `;
      yield "This may indicate the local model lacks the capability to solve this problem.\n\n";
      yield "**Suggestions:**\n";
      yield "- Try a more capable local model (e.g., `qwen2.5-coder:32b`, `deepseek-coder:33b`, `codellama:70b`)\n";
      yield "- Use a cloud model (OpenAI GPT-4, Claude, etc.) for complex tasks\n";
      yield "- Simplify the requirement into smaller steps\n";
      yield "\n_Continuing to try... (will stop at iteration ${MAX_ITERATIONS})_\n\n";
      yield "---\n\n";
    }

    // For Rust, we need to generate impl + test in one file
    const implPrompt = isRust
      ? iteration === 1
        ? `Write the MINIMAL Rust implementation to make this test pass, then include the test at the bottom.

Test code:
\`\`\`rust
${truncateContent(cleanTestCode, contextLimit)}
\`\`\`

Requirements:
1. Write a public function that the test calls
2. Keep it simple - minimal code only
3. Include the test module at the bottom with #[cfg(test)]

IMPORTANT: Respond with ONLY the complete Rust file (implementation + test). Do NOT wrap in markdown code blocks.`
        : `The previous implementation failed. Fix the code to make the test pass.

Previous code:
\`\`\`rust
${truncateContent(implCode, contextLimit)}
\`\`\`

Test output (failure):
\`\`\`
${truncateContent(testResult.output, 2000)}
\`\`\`

Fix the implementation. The file should contain:
1. The implementation function(s) at the top
2. The test module at the bottom with #[cfg(test)]

IMPORTANT: Respond with ONLY the complete fixed Rust file. Do NOT wrap in markdown code blocks.`
      : iteration === 1
        ? `Write the MINIMAL implementation code to make this test pass. No extra features, just enough to pass the test.

Test code:
\`\`\`${testFramework.language}
${truncateContent(cleanTestCode, contextLimit)}
\`\`\`

Guidelines:
1. Keep it simple - minimal code only
2. Don't anticipate future requirements
3. Focus on making the test green
4. Write properly formatted code with correct indentation and newlines

IMPORTANT: Respond with ONLY the raw implementation code. Do NOT wrap it in markdown code blocks. Do NOT include any explanation.`
        : `The previous implementation failed. Fix the code to make this test pass.

Test code:
\`\`\`${testFramework.language}
${truncateContent(cleanTestCode, contextLimit)}
\`\`\`

Previous implementation:
\`\`\`${testFramework.language}
${truncateContent(implCode, contextLimit)}
\`\`\`

Test output (failure):
\`\`\`
${truncateContent(testResult.output, 2000)}
\`\`\`

Fix the implementation to make the test pass.
IMPORTANT: Respond with ONLY the complete fixed implementation code. Do NOT wrap it in markdown code blocks. Do NOT include any explanation.`;

    implCode = "";
    yield "🤖 _Generating implementation..._\n\n";
    yield "**Generated implementation:**\n```" + testFramework.language + "\n";
    for await (const chunk of model.streamComplete(implPrompt)) {
      implCode += chunk;
      yield chunk;
    }
    yield "\n```\n\n";

    if (!implCode.trim()) {
      yield "❌ **Error:** Model did not generate any implementation code.\n";
      yield "_Skipping this iteration..._\n\n";
      continue;
    }

    // Clean the complete output (not individual chunks)
    const cleanImplCode = stripCodeBlock(implCode);

    // Check for repetition (model generating same/similar code)
    const normalizedCode = cleanImplCode.replace(/\s+/g, " ").trim();
    const isRepetition = previousImplCodes.some((prev) => {
      const prevNormalized = prev.replace(/\s+/g, " ").trim();
      // Check for exact match or very similar (>90% same)
      if (prevNormalized === normalizedCode) return true;
      // Simple similarity check - if the first 80% is identical
      const checkLen = Math.floor(
        Math.min(prevNormalized.length, normalizedCode.length) * 0.8,
      );
      return (
        checkLen > 50 &&
        prevNormalized.slice(0, checkLen) === normalizedCode.slice(0, checkLen)
      );
    });

    if (isRepetition && !capabilities.isCloud) {
      yield "⚠️ **Repetition Detected:** Model is generating similar code to previous attempts.\n";
      yield "This suggests the model may not understand how to fix the issue.\n\n";
      if (iteration >= 3) {
        yield "🛑 **Recommendation:** Try a more capable model or simplify the requirement.\n\n";
      }
    }
    previousImplCodes.push(cleanImplCode);

    // Use target file if specified, otherwise generate a filename
    // For Rust with target file, impl goes in same file as test (unit tests)
    const implFilename = targetFile
      ? targetFile.startsWith("src/")
        ? targetFile
        : `src/${targetFile}`
      : suggestImplFilename(userRequest, testFramework);
    const fullImplPath = path.join(rootPath, implFilename);

    yield `📝 **Writing:** \`${implFilename}\`\n`;
    try {
      await writeFileWithIde(ide, fullImplPath, cleanImplCode);
      // Open the file to refresh the editor (like autonomous mode)
      await ide.openFile(pathToFileUri(fullImplPath));
      yield `✅ **${targetFile ? "Updated" : "Created"}:** \`${implFilename}\`\n\n`;

      // For Rust, register the module in lib.rs
      if (isRust) {
        const moduleName = path.basename(implFilename, ".rs");
        await registerRustModule(ide, rootPath, moduleName);
        yield `📦 **Registered module:** \`${moduleName}\` in lib.rs\n\n`;
      }
    } catch (err) {
      yield `❌ **Error creating file:** ${err}\n\n`;
      continue;
    }

    // Run tests again (use module-specific command)
    yield `🏃 **Running tests:** \`${testCommand}\`\n\n`;
    testResult = await executeCommand(ide, testCommand, rootPath);

    yield "<details>\n<summary>Test Output (click to expand)</summary>\n\n";
    yield "```\n" + testResult.output.slice(0, 6000) + "\n```\n";
    yield "</details>\n\n";

    if (testResult.passed) {
      yield "✅ **Tests pass!** 🎉\n\n";
      break;
    } else {
      yield "❌ **Tests still failing** (exit code: " +
        testResult.exitCode +
        ")\n\n";
    }
  }

  if (!testResult.passed) {
    yield `\n---\n`;
    yield `⛔ **Max iterations (${MAX_ITERATIONS}) reached.** Tests still failing.\n\n`;
    if (!capabilities.isCloud) {
      yield "**The local model was unable to solve this problem.**\n\n";
      yield "**Recommended actions:**\n";
      yield "1. **Try a more capable model:**\n";
      yield "   - `qwen2.5-coder:32b` - Better reasoning\n";
      yield "   - `deepseek-coder:33b` - Strong at code\n";
      yield "   - `codellama:70b` - Large context\n";
      yield "   - Cloud models (GPT-4, Claude) for complex tasks\n\n";
      yield "2. **Simplify the requirement** - Break into smaller steps\n\n";
      yield "3. **Check the test** - Ensure it's correct and achievable\n";
    } else {
      yield "You may need to manually fix the implementation based on the test output.\n";
      yield "Consider breaking down the requirement into smaller, simpler steps.\n";
    }
    yield "\n";
  }

  // ==========================================================================
  // Phase 3: REFACTOR
  // ==========================================================================
  yield "## 🔵 Phase 3: REFACTOR - Suggesting improvements\n\n";

  const truncatedImplCode = truncateContent(
    stripCodeBlock(implCode),
    contextLimit,
  );
  const truncatedTestCode = truncateContent(cleanTestCode, contextLimit);

  const refactorPrompt = `Review this implementation and suggest refactoring improvements while keeping tests passing.

Test:
\`\`\`${testFramework.language}
${truncatedTestCode}
\`\`\`

Implementation:
\`\`\`${testFramework.language}
${truncatedImplCode}
\`\`\`

Suggest improvements for:
1. Code clarity
2. Naming
3. Duplication removal
4. Design patterns (if applicable)

Be concise.`;

  for await (const chunk of model.streamComplete(refactorPrompt)) {
    yield chunk;
  }
  yield "\n\n";

  // Final summary
  yield "---\n\n";
  if (testResult.passed) {
    yield "## ✅ TDD Cycle Complete!\n\n";
    yield "**Files created:**\n";
    yield `- \`${testFilename}\` (test)\n`;
    yield `- \`${suggestImplFilename(userRequest, testFramework)}\` (implementation)\n\n`;
    yield `**Iterations:** ${iteration}\n\n`;
  } else {
    yield "## ⚠️ TDD Cycle Incomplete\n\n";
    yield "Tests are still failing after max iterations. Manual intervention needed.\n\n";
  }
  yield '_Say "continue" to start a new TDD cycle._\n';
}

/**
 * Handle continuation from a previous TDD state
 * Since TDD is now fully automated, continuation just provides guidance
 */
async function* handleContinuation(
  model: any,
  capabilities: any,
  state: TDDState,
  ide: IDE,
  fileCache: FileCache,
): AsyncGenerator<string> {
  yield "🧪 **TDD Mode - Previous Cycle Found**\n\n";

  const providerInfo = capabilities.isCloud ? "☁️ Cloud" : "🖥️ Local";
  const cachingInfo = capabilities.supportsCaching ? " | 💾 Caching" : "";
  yield `_Model: ${model.model || "unknown"} | ${providerInfo}${cachingInfo}_\n\n`;

  yield `**Previous requirement:** "${state.requirement}"\n`;
  yield `**Phase reached:** ${state.phase.toUpperCase()}\n\n`;

  if (state.phase === "complete") {
    yield "✅ The previous TDD cycle is already complete!\n\n";
    yield "**Ready for a new cycle.** Describe your next requirement to start.\n";
    yield "\nExamples:\n";
    yield '- "Implement a function that validates phone numbers"\n';
    yield '- "Add error handling to the existing function"\n';
    yield '- "Create a new utility for date formatting"\n';
  } else {
    yield "The previous cycle was interrupted.\n\n";
    yield "**Options:**\n";
    yield "1. Describe the same requirement again to restart the full TDD cycle\n";
    yield "2. Describe a new requirement to start a fresh cycle\n";
    yield "\n_TDD mode will automatically: write tests → run them → implement → run again → iterate until passing._\n";
  }
}

interface TestFramework {
  name: string;
  command: string;
  language: string;
  testPattern: string;
}

/**
 * Detect the test framework used in the project
 */
async function detectTestFramework(
  ide: IDE,
  rootPath: string,
  fileCache?: FileCache,
  userRequest?: string,
): Promise<TestFramework> {
  // Check for common test frameworks by looking for config files
  const frameworks: Array<{
    files: string[];
    framework: TestFramework;
  }> = [
    {
      files: ["jest.config.js", "jest.config.ts", "jest.config.json"],
      framework: {
        name: "Jest",
        command: "npm test",
        language: "typescript",
        testPattern: "*.test.ts",
      },
    },
    {
      files: ["vitest.config.ts", "vitest.config.js"],
      framework: {
        name: "Vitest",
        command: "npx vitest",
        language: "typescript",
        testPattern: "*.test.ts",
      },
    },
    {
      files: ["pytest.ini", "pyproject.toml", "setup.py"],
      framework: {
        name: "pytest",
        command: "pytest",
        language: "python",
        testPattern: "test_*.py",
      },
    },
    {
      files: ["Cargo.toml"],
      framework: {
        name: "cargo test",
        command: "cargo test",
        language: "rust",
        testPattern: "*_test.rs",
      },
    },
    {
      files: ["go.mod"],
      framework: {
        name: "go test",
        command: "go test ./...",
        language: "go",
        testPattern: "*_test.go",
      },
    },
  ];

  for (const { files, framework } of frameworks) {
    for (const file of files) {
      const exists = await ide.fileExists(rootPath + "/" + file);
      if (exists) {
        return framework;
      }
    }
  }

  // Check package.json for test script (with caching)
  try {
    const pkgJsonPath = rootPath + "/package.json";
    let pkgJson: string;
    if (fileCache) {
      pkgJson = await fileCache.readFile(ide, pkgJsonPath);
    } else {
      pkgJson = await ide.readFile(pkgJsonPath);
    }
    const pkg = JSON.parse(pkgJson);
    if (pkg.scripts?.test) {
      return {
        name: "npm test",
        command: "npm test",
        language: "typescript",
        testPattern: "*.test.ts",
      };
    }
  } catch {
    // No package.json
  }

  // Try to infer from user request
  if (userRequest) {
    const lowerRequest = userRequest.toLowerCase();
    if (lowerRequest.includes("rust") || lowerRequest.includes(".rs")) {
      return {
        name: "cargo test",
        command: "cargo test",
        language: "rust",
        testPattern: "*_test.rs",
      };
    }
    if (lowerRequest.includes("python") || lowerRequest.includes(".py")) {
      return {
        name: "pytest",
        command: "pytest",
        language: "python",
        testPattern: "test_*.py",
      };
    }
    if (
      lowerRequest.includes("golang") ||
      lowerRequest.includes(".go") ||
      lowerRequest.includes("go test")
    ) {
      return {
        name: "go test",
        command: "go test ./...",
        language: "go",
        testPattern: "*_test.go",
      };
    }
  }

  // Try to infer from current file
  const currentFile = await ide.getCurrentFile();
  if (currentFile?.path) {
    if (currentFile.path.endsWith(".rs")) {
      return {
        name: "cargo test",
        command: "cargo test",
        language: "rust",
        testPattern: "*_test.rs",
      };
    }
    if (currentFile.path.endsWith(".py")) {
      return {
        name: "pytest",
        command: "pytest",
        language: "python",
        testPattern: "test_*.py",
      };
    }
    if (currentFile.path.endsWith(".go")) {
      return {
        name: "go test",
        command: "go test ./...",
        language: "go",
        testPattern: "*_test.go",
      };
    }

    // Try to infer from content
    const content = currentFile.contents.toLowerCase();
    if (content.includes("fn main") || content.includes("use std::")) {
      return {
        name: "cargo test",
        command: "cargo test",
        language: "rust",
        testPattern: "*_test.rs",
      };
    }
    if (content.includes("def ") || content.includes("import ")) {
      return {
        name: "pytest",
        command: "pytest",
        language: "python",
        testPattern: "test_*.py",
      };
    }
    if (content.includes("package main") || content.includes("func main")) {
      return {
        name: "go test",
        command: "go test ./...",
        language: "go",
        testPattern: "*_test.go",
      };
    }
  }

  // Default to Jest
  return {
    name: "Jest (default)",
    command: "npm test",
    language: "typescript",
    testPattern: "*.test.ts",
  };
}

/**
 * Suggest a test filename based on the requirement.
 * For Rust, adds a unique suffix to avoid conflicts with other test modules.
 */
function suggestTestFilename(
  requirement: string,
  framework: TestFramework,
): string {
  // Clean requirement of code blocks and special chars
  const cleanRequirement = requirement
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/[^a-zA-Z0-9\s]/g, " "); // Keep only text

  // Extract key words from requirement
  const words = cleanRequirement
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !["test", "write", "create", "make", "function", "that"].includes(w),
    )
    .slice(0, 2);

  const baseName = words.join("_") || "feature";

  switch (framework.language) {
    case "python":
      return `tests/test_${baseName}.py`;
    case "rust":
      // For Rust, add tdd_ prefix to make module names unique and filterable
      // This prevents conflicts with other test modules that might contain similar names
      return `src/tdd_${baseName}.rs`;
    case "go":
      return `${baseName}_test.go`;
    default:
      return `__tests__/${baseName.replace(/_/g, "-")}.test.ts`;
  }
}

/**
 * Suggest an implementation filename based on the requirement
 */
function suggestImplFilename(
  requirement: string,
  framework: TestFramework,
): string {
  // Clean requirement of code blocks and special chars
  const cleanRequirement = requirement
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/[^a-zA-Z0-9\s]/g, " "); // Keep only text

  // Extract key words from requirement
  const words = cleanRequirement
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !["test", "write", "create", "make", "function", "that"].includes(w),
    )
    .slice(0, 2);

  const baseName = words.join("_") || "feature";

  switch (framework.language) {
    case "python":
      return `src/${baseName}.py`;
    case "rust":
      // For Rust, use same tdd_ prefix as test file (they're the same file)
      return `src/tdd_${baseName}.rs`;
    case "go":
      return `${baseName}.go`;
    default:
      return `src/${baseName.replace(/_/g, "-")}.ts`;
  }
}

/**
 * Strip markdown code block markers from code
 * Preserves all whitespace and newlines within the code
 */
function stripCodeBlock(code: string): string {
  let result = code;

  // First, try to extract just the code block if the model output explanatory text
  // This handles: "Here's the fix:\n```rust\ncode here\n```"
  const codeBlockMatch = result.match(/```[\w-]*\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    result = codeBlockMatch[1];
  } else {
    // Try to find code block without newline after lang tag: "```rust code"
    const altBlockMatch = result.match(/```[\w-]*\s*([\s\S]*?)```/);
    if (altBlockMatch) {
      result = altBlockMatch[1];
    } else {
      // Remove opening code fence with optional language tag
      // Handles: ```rust, ```typescript, ```, etc.
      result = result.replace(/^\s*```[\w-]*\s*\n?/, "");

      // Remove closing code fence
      result = result.replace(/\n?```\s*$/, "");
    }
  }

  // Remove any explanatory text before code starts (for Rust)
  // Only apply if we can find Rust keywords, otherwise leave as-is
  const rustKeywords =
    /(?:pub\s+)?(?:fn|struct|impl|mod|use|const|static|type|trait|enum|async\s+fn)\s/;
  if (rustKeywords.test(result)) {
    // Find where the actual code starts and remove everything before it
    const match = result.match(
      /^[\s\S]*?((?:pub\s+)?(?:fn|struct|impl|mod|use|const|static|type|trait|enum|async\s+fn)\s)/m,
    );
    if (match && match.index !== undefined) {
      // Keep from the keyword onwards
      result = result.slice(match.index + match[0].length - match[1].length);
    }
  }

  // Also check for Python code
  const pythonKeywords = /(?:def|class|import|from|async\s+def)\s/;
  if (pythonKeywords.test(result) && !rustKeywords.test(result)) {
    const match = result.match(
      /^[\s\S]*?((?:def|class|import|from|async\s+def)\s)/m,
    );
    if (match && match.index !== undefined) {
      result = result.slice(match.index + match[0].length - match[1].length);
    }
  }

  // Handle case where model outputs language name at the very start without fence
  // e.g., "rustfn main()" or "rustrustfn main()"
  result = result.replace(
    /^(rust|python|go|typescript|javascript|ts|js|py|java|cpp|csharp)+\s*/gi,
    "",
  );

  // Handle case where code is somehow concatenated without whitespace
  // This is a fallback for models that output malformed code
  // Check if it looks like concatenated Rust code (e.g., "fnmain(){}")
  if (result.match(/^(fn|pub|struct|impl|mod|use|const|let|type)[a-z_]/i)) {
    // Try to add spaces after keywords
    result = result
      .replace(/\b(fn)([a-z_])/gi, "$1 $2")
      .replace(/\b(pub)([a-z_])/gi, "$1 $2")
      .replace(/\b(struct)([a-z_])/gi, "$1 $2")
      .replace(/\b(impl)([a-z_])/gi, "$1 $2")
      .replace(/\b(mod)([a-z_])/gi, "$1 $2")
      .replace(/\b(use)([a-z_])/gi, "$1 $2")
      .replace(/\b(let)([a-z_])/gi, "$1 $2")
      .replace(/\b(mut)([a-z_])/gi, "$1 $2");
  }

  // Only trim leading/trailing blank lines, preserve internal whitespace
  result = result.replace(/^\n+/, "").replace(/\n+$/, "");

  return result;
}
