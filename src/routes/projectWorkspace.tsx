
import { useState } from "react";
import KanbanBoard from "../component/kanban/kanbanBoard";
import type {
  Task,
  TaskStatus,
} from "../component/kanban/kanban.type";

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Design Dashboard",
    description: "Create the dashboard UI",
    status: "todo",
    priority: "high",
    assignee: "Sadia",
  },
  {
    id: 2,
    title: "Build API",
    description: "Implement task endpoints",
    status: "in-progress",
    priority: "medium",
    assignee: "Developer",
  },
  {
    id: 3,
    title: "Test Kanban Board",
    description: "Check drag and drop",
    status: "review",
    priority: "high",
  },
  {
    id: 4,
    title: "Project Setup",
    description: "Initial setup completed",
    status: "done",
    priority: "low",
  },
];

export default function ProjectWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  function handleTaskMove(
    id: Task["id"],
    newStatus: TaskStatus
  ) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, status: newStatus }
          : task
      )
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Project Workspace</h1>

      <KanbanBoard
        tasks={tasks}
        boardType="project"
        onTaskMove={handleTaskMove}
      />
    </div>
  );
}
