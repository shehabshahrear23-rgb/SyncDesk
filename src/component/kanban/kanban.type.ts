
export type BoardType = "project" | "operation" | "sprint";

export type TaskStatus =
  | "todo"
  | "in-progress"
  | "review"
  | "done";

export interface Task {
  id: number | string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: "low" | "medium" | "high";
  assignee?: string;
}

export interface KanbanBoardProps {
  tasks: Task[];
  boardType: BoardType;
  onTaskMove: (
    id: Task["id"],
    newStatus: TaskStatus
  ) => void | Promise<void>;
}
