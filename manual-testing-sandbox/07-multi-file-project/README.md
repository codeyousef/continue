# E-Commerce Backend

A realistic multi-file TypeScript project for testing @codebase and cross-file features.

## Structure

```
07-multi-file-project/
├── src/
│   ├── index.ts              # Entry point
│   ├── models/               # Data models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   └── Order.ts
│   ├── services/             # Business logic
│   │   ├── UserService.ts
│   │   ├── ProductService.ts
│   │   └── OrderService.ts
│   ├── controllers/          # API endpoints
│   │   └── api.ts
│   └── utils/                # Shared utilities
│       ├── validators.ts
│       └── formatters.ts
├── package.json
└── tsconfig.json
```

## Test Scenarios

### @file Testing

```
@file:07-multi-file-project/src/models/User.ts
Explain this model
```

### @codebase Testing

```
@codebase
How does the order processing flow work?
Where is User used across the codebase?
```

### Cross-file Refactoring

```
Rename the User model to Customer and update all usages
```

### Understanding Dependencies

```
What services depend on the User model?
Show me the data flow from API to database
```
