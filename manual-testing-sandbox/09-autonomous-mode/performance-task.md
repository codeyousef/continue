# Performance Optimization Task

## Task Description

Optimize the following inefficient code for better performance. This tests the agent's ability to identify and fix performance issues.

## Target File: `slow-code.ts`

Create this file first, then optimize it:

```typescript
// WARNING: This code has serious performance issues!
// Your task: Make it fast.

interface Record {
  id: string;
  userId: string;
  category: string;
  value: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

// Performance Issue #1: O(n²) lookup
function getUserRecords(
  records: Record[],
  users: User[],
  userId: string,
): Record[] {
  return records.filter((record) => {
    // Searching users array for every record - O(n) for each filter iteration
    const user = users.find((u) => u.id === record.userId);
    return user && user.id === userId;
  });
}

// Performance Issue #2: Repeated expensive calculations
function calculateStatistics(records: Record[]): {
  total: number;
  average: number;
  max: number;
  min: number;
  count: number;
} {
  return {
    total: records.reduce((sum, r) => sum + r.value, 0),
    average: records.reduce((sum, r) => sum + r.value, 0) / records.length,
    max: Math.max(...records.map((r) => r.value)),
    min: Math.min(...records.map((r) => r.value)),
    count: records.length,
  };
}

// Performance Issue #3: N+1 query pattern
async function getRecordsWithUsers(
  recordIds: string[],
): Promise<Array<{ record: Record; user: User }>> {
  const results = [];

  for (const id of recordIds) {
    const record = await fetchRecord(id); // Individual fetch for each record
    const user = await fetchUser(record.userId); // Individual fetch for each user
    results.push({ record, user });
  }

  return results;
}

// Performance Issue #4: Inefficient string concatenation
function buildReport(records: Record[]): string {
  let report = "";

  for (const record of records) {
    report += `ID: ${record.id}\n`;
    report += `Value: ${record.value}\n`;
    report += `Category: ${record.category}\n`;
    report += `---\n`;
  }

  return report;
}

// Performance Issue #5: Memory-inefficient data transformation
function processLargeDataset(records: Record[]): number[] {
  // Creates multiple intermediate arrays
  const filtered = records.filter((r) => r.value > 0);
  const mapped = filtered.map((r) => r.value * 2);
  const sorted = mapped.sort((a, b) => b - a);
  const sliced = sorted.slice(0, 100);
  return sliced;
}

// Performance Issue #6: Blocking operation in loop
function hashAllRecords(records: Record[]): string[] {
  const hashes: string[] = [];

  for (const record of records) {
    // Expensive synchronous hash computation for each record
    const hash = computeExpensiveHash(JSON.stringify(record));
    hashes.push(hash);
  }

  return hashes;
}

// Performance Issue #7: Unnecessary re-renders / recomputation
class DataCache {
  private data: Record[] = [];

  setData(newData: Record[]) {
    this.data = newData;
  }

  // Recomputes on every call
  getByCategory(category: string): Record[] {
    return this.data.filter((r) => r.category === category);
  }

  // Recomputes on every call
  getTotal(): number {
    return this.data.reduce((sum, r) => sum + r.value, 0);
  }
}

// Performance Issue #8: Inefficient duplicate detection
function findDuplicates(records: Record[]): Record[] {
  const duplicates: Record[] = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      if (records[i].id === records[j].id) {
        duplicates.push(records[i]);
      }
    }
  }

  return duplicates;
}

// Performance Issue #9: Excessive DOM-like operations (simulated)
function updateDisplay(records: Record[]): void {
  for (const record of records) {
    // Simulated: Would cause layout thrashing in browser
    const element = findElement(record.id);
    element.setText(record.value.toString());
    element.setStyle({ color: record.value > 0 ? "green" : "red" });
    element.setVisible(true);
  }
}

// Performance Issue #10: Unbounded recursion risk
function flattenNestedData(data: unknown): unknown[] {
  if (Array.isArray(data)) {
    return data.flatMap((item) => flattenNestedData(item));
  }
  return [data];
}

// Helper stubs
declare function fetchRecord(id: string): Promise<Record>;
declare function fetchUser(id: string): Promise<User>;
declare function computeExpensiveHash(data: string): string;
declare function findElement(id: string): {
  setText: (t: string) => void;
  setStyle: (s: object) => void;
  setVisible: (v: boolean) => void;
};

export {
  getUserRecords,
  calculateStatistics,
  getRecordsWithUsers,
  buildReport,
  processLargeDataset,
  hashAllRecords,
  DataCache,
  findDuplicates,
  updateDisplay,
  flattenNestedData,
};
```

## Requirements

### 1. Identify Performance Issues

For each issue:

- Describe the problem
- Explain the complexity (Big O)
- Estimate the impact

### 2. Optimize Each Function

Apply optimizations:

- Use appropriate data structures (Map, Set)
- Reduce time complexity where possible
- Minimize memory allocations
- Use batching for I/O operations

### 3. Maintain Correctness

- Optimized code must produce same results
- Add tests to verify correctness

## Expected Optimizations

1. **O(n²) to O(n)**: Use Map for user lookup
2. **Single pass**: Compute all statistics in one reduce
3. **Batch queries**: Fetch all records/users at once
4. **String builder**: Use array.join() instead of concatenation
5. **Chain methods**: Use single pass or reduce intermediate arrays
6. **Parallel processing**: Use Promise.all for async operations
7. **Memoization**: Cache computed values
8. **Set lookup**: Use Set for O(1) duplicate detection
9. **Batch updates**: Collect changes, apply once
10. **Iteration limit**: Add max depth protection

## Acceptance Criteria

- [ ] All 10 issues identified and fixed
- [ ] Big O improvements documented
- [ ] Code produces correct results
- [ ] Memory usage improved where applicable
- [ ] Code compiles without errors

## Example Optimizations

### Before: O(n²)

```typescript
function findInArray(items: string[], targets: string[]): string[] {
  return targets.filter((t) => items.includes(t));
}
```

### After: O(n)

```typescript
function findInArray(items: string[], targets: string[]): string[] {
  const itemSet = new Set(items);
  return targets.filter((t) => itemSet.has(t));
}
```

## Hints for the Agent

1. Profile before optimizing (identify real bottlenecks)
2. Map/Set for lookups, not arrays
3. Batch I/O operations
4. Avoid creating intermediate arrays
5. Memoize expensive computations
6. Consider lazy evaluation
7. Use appropriate algorithms (sorting, searching)
