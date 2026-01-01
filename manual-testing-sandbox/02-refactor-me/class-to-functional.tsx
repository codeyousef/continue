// REFACTOR ME: Convert this React class component to functional component with hooks

import React, { Component, createRef } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface Props {
  initialTodos?: Todo[];
  onTodoChange?: (todos: Todo[]) => void;
  maxTodos?: number;
}

interface State {
  todos: Todo[];
  inputValue: string;
  filter: "all" | "active" | "completed";
  isLoading: boolean;
  error: string | null;
  editingId: number | null;
  editText: string;
}

// Class component that should be converted to functional component with hooks
class TodoList extends Component<Props, State> {
  private inputRef = createRef<HTMLInputElement>();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      todos: props.initialTodos || [],
      inputValue: "",
      filter: "all",
      isLoading: false,
      error: null,
      editingId: null,
      editText: "",
    };

    // Binding methods
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleAddTodo = this.handleAddTodo.bind(this);
    this.handleToggleTodo = this.handleToggleTodo.bind(this);
    this.handleDeleteTodo = this.handleDeleteTodo.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleStartEdit = this.handleStartEdit.bind(this);
    this.handleSaveEdit = this.handleSaveEdit.bind(this);
    this.handleCancelEdit = this.handleCancelEdit.bind(this);
  }

  componentDidMount(): void {
    // Focus input on mount
    this.inputRef.current?.focus();

    // Load todos from localStorage
    const saved = localStorage.getItem("todos");
    if (saved) {
      try {
        const todos = JSON.parse(saved);
        this.setState({ todos });
      } catch (e) {
        console.error("Failed to load todos");
      }
    }

    // Add keyboard listener
    document.addEventListener("keydown", this.handleKeyDown);
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    // Notify parent of changes
    if (prevState.todos !== this.state.todos && this.props.onTodoChange) {
      this.props.onTodoChange(this.state.todos);
    }

    // Auto-save with debounce
    if (prevState.todos !== this.state.todos) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        localStorage.setItem("todos", JSON.stringify(this.state.todos));
      }, 500);
    }
  }

  componentWillUnmount(): void {
    // Cleanup
    document.removeEventListener("keydown", this.handleKeyDown);
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && this.state.editingId !== null) {
      this.handleCancelEdit();
    }
  };

  handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    this.setState({ inputValue: e.target.value, error: null });
  }

  handleAddTodo(): void {
    const { inputValue, todos } = this.state;
    const { maxTodos } = this.props;

    if (!inputValue.trim()) {
      this.setState({ error: "Todo text cannot be empty" });
      return;
    }

    if (maxTodos && todos.length >= maxTodos) {
      this.setState({ error: `Maximum ${maxTodos} todos allowed` });
      return;
    }

    const newTodo: Todo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      createdAt: new Date(),
    };

    this.setState({
      todos: [...todos, newTodo],
      inputValue: "",
      error: null,
    });
  }

  handleToggleTodo(id: number): void {
    this.setState((state) => ({
      todos: state.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    }));
  }

  handleDeleteTodo(id: number): void {
    this.setState((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  }

  handleFilterChange(filter: "all" | "active" | "completed"): void {
    this.setState({ filter });
  }

  handleStartEdit(todo: Todo): void {
    this.setState({
      editingId: todo.id,
      editText: todo.text,
    });
  }

  handleSaveEdit(): void {
    const { editingId, editText, todos } = this.state;

    if (!editText.trim()) {
      this.handleDeleteTodo(editingId!);
    } else {
      this.setState({
        todos: todos.map((todo) =>
          todo.id === editingId ? { ...todo, text: editText.trim() } : todo,
        ),
      });
    }

    this.setState({ editingId: null, editText: "" });
  }

  handleCancelEdit(): void {
    this.setState({ editingId: null, editText: "" });
  }

  getFilteredTodos(): Todo[] {
    const { todos, filter } = this.state;

    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }

  render(): React.ReactNode {
    const { todos, inputValue, filter, error, editingId, editText } =
      this.state;
    const filteredTodos = this.getFilteredTodos();
    const activeCount = todos.filter((t) => !t.completed).length;

    return (
      <div className="todo-list">
        <h1>Todo List</h1>

        {error && <div className="error">{error}</div>}

        <div className="input-section">
          <input
            ref={this.inputRef}
            type="text"
            value={inputValue}
            onChange={this.handleInputChange}
            onKeyPress={(e) => e.key === "Enter" && this.handleAddTodo()}
            placeholder="Add a new todo..."
          />
          <button onClick={this.handleAddTodo}>Add</button>
        </div>

        <div className="filters">
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              className={filter === f ? "active" : ""}
              onClick={() => this.handleFilterChange(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <ul className="todos">
          {filteredTodos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "completed" : ""}>
              {editingId === todo.id ? (
                <div className="editing">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) =>
                      this.setState({ editText: e.target.value })
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && this.handleSaveEdit()
                    }
                    autoFocus
                  />
                  <button onClick={this.handleSaveEdit}>Save</button>
                  <button onClick={this.handleCancelEdit}>Cancel</button>
                </div>
              ) : (
                <div className="view">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => this.handleToggleTodo(todo.id)}
                  />
                  <span onDoubleClick={() => this.handleStartEdit(todo)}>
                    {todo.text}
                  </span>
                  <button onClick={() => this.handleDeleteTodo(todo.id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="footer">
          <span>{activeCount} items left</span>
          {todos.some((t) => t.completed) && (
            <button
              onClick={() =>
                this.setState({ todos: todos.filter((t) => !t.completed) })
              }
            >
              Clear completed
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default TodoList;
