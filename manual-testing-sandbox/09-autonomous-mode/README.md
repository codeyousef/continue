# 09 - Autonomous Mode Tasks

This folder contains task specifications designed to test the **Autonomous Mode** feature.
Each file describes a complex, multi-step task that the AI agent should be able to complete
independently with minimal user intervention.

## Purpose

Test that the autonomous agent can:

- Break down complex tasks into actionable steps
- Navigate the codebase to find relevant files
- Make multiple coordinated edits across files
- Handle errors and course-correct
- Complete end-to-end feature implementations

## Tasks

### 1. Feature Request (`feature-request.md`)

**Difficulty:** Medium
**Scope:** Add email notification system to e-commerce project

The agent should:

- Create a new NotificationService
- Integrate with OrderService for order notifications
- Add email templates
- Update User model with notification preferences

### 2. Migration Task (`migration-task.md`)

**Difficulty:** Hard
**Scope:** Migrate callback-based code to async/await

The agent should:

- Identify all callback patterns in target files
- Refactor to modern async/await
- Update error handling
- Ensure tests still pass (or update them)

### 3. New Project (`new-project.md`)

**Difficulty:** Hard
**Scope:** Create a complete REST API from scratch

The agent should:

- Set up project structure
- Create models, services, controllers
- Add validation and error handling
- Generate API documentation

### 4. Bug Hunt (`bug-hunt.md`)

**Difficulty:** Medium
**Scope:** Find and fix all bugs in a buggy module

The agent should:

- Analyze code for potential issues
- Identify actual bugs vs false positives
- Fix each bug with appropriate solution
- Verify fixes don't introduce regressions

### 5. Performance Optimization (`performance-task.md`)

**Difficulty:** Hard
**Scope:** Optimize slow database queries and algorithms

The agent should:

- Profile and identify bottlenecks
- Implement caching strategies
- Optimize data structures and algorithms
- Add appropriate indexes

## Usage

1. Open any task file in the workspace
2. Enable Autonomous Mode
3. Give the agent the task description
4. Observe how it plans and executes the work

## Evaluation Criteria

- **Completeness**: Did it finish all requirements?
- **Correctness**: Does the code work correctly?
- **Code Quality**: Is the code clean and maintainable?
- **Efficiency**: Did it take a reasonable number of steps?
- **Error Recovery**: Did it handle issues gracefully?
