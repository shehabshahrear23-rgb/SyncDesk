import { useState } from "react";
import KanbanBoard from "../component/kanban/kanbanBoard";
import type {
  Task,
  TaskStatus,
} from "../component/kanban/kanban.type";

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Sprint Planning",
    description: "Define sprint goals and scope",
    status: "todo",
    priority: "high",
    assignee: "Team Lead",
  },
  {
    id: 2,
    title: "Development",
    description: "Implement sprint features",
    status: "in-progress",
    priority: "medium",
    assignee: "Developers",
  },
  {
    id: 3,
    title: "QA Review",
    description: "Validate user stories",
    status: "review",
    priority: "high",
    assignee: "QA",
  },
  {
    id: 4,
    title: "Release Notes",
    description: "Document completed sprint work",
    status: "done",
    priority: "low",
  },
];

export default function SprintWorkspace() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  function handleTaskMove(
    id: Task["id"],
    newStatus: TaskStatus
  ) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ? { ...task, status: newStatus } : task
      )
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <h1>Sprint Workspace</h1>

      <KanbanBoard
        tasks={tasks}
        boardType="sprint"
        onTaskMove={handleTaskMove}
      />
    </div>
  );
}