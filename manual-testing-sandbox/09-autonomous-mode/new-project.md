# New Project: Task Management API

## Task Description

Create a complete REST API for a task management system from scratch. This tests the agent's ability to scaffold an entire project structure.

## Project Requirements

### 1. Project Structure

Create the following structure:

```
task-manager/
├── package.json
├── tsconfig.json
├── .env.example
├── README.md
├── src/
│   ├── index.ts
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   ├── Task.ts
│   │   ├── Project.ts
│   │   ├── User.ts
│   │   └── Comment.ts
│   ├── services/
│   │   ├── TaskService.ts
│   │   ├── ProjectService.ts
│   │   └── UserService.ts
│   ├── controllers/
│   │   ├── taskController.ts
│   │   ├── projectController.ts
│   │   └── userController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   └── utils/
│       ├── logger.ts
│       └── helpers.ts
└── tests/
    ├── task.test.ts
    └── project.test.ts
```

### 2. Data Models

#### Task

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Date;
  tags: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Project

```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  status: "active" | "archived" | "completed";
  createdAt: Date;
  updatedAt: Date;
}
```

#### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "admin" | "member" | "viewer";
  createdAt: Date;
}
```

### 3. API Endpoints

#### Tasks

- `GET /api/tasks` - List tasks (with filtering)
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment
- `PATCH /api/tasks/:id/status` - Update status

#### Projects

- `GET /api/projects` - List user's projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/members` - Add member
- `DELETE /api/projects/:id/members/:userId` - Remove member

#### Users

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile

### 4. Business Logic Requirements

1. **Task Assignment**: Only project members can be assigned tasks
2. **Status Transitions**: Enforce valid status transitions
3. **Permissions**:
   - Admins can do anything
   - Members can manage their assigned tasks
   - Viewers can only read
4. **Notifications**: Log when tasks are assigned/completed

### 5. Validation

Implement validation for:

- Email format
- Required fields
- String length limits
- Valid enum values
- Date ranges (due date must be in future)

### 6. Error Handling

Create consistent error responses:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

## Acceptance Criteria

- [ ] All files in the structure are created
- [ ] All models have complete type definitions
- [ ] All service methods are implemented
- [ ] All API endpoints are defined
- [ ] Validation middleware works correctly
- [ ] Error handling is consistent
- [ ] TypeScript compiles without errors
- [ ] README documents the API

## Hints for the Agent

1. Start with models - they define the data structure
2. Create services with in-memory storage for simplicity
3. Use dependency injection patterns
4. Keep controllers thin - delegate to services
5. Create reusable validation functions
6. Follow REST conventions for status codes

## Stretch Goals

If the basic requirements are complete:

- Add pagination to list endpoints
- Implement search functionality
- Add audit logging
- Create API documentation (OpenAPI/Swagger)
