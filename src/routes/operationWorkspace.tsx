import { useState } from "react";
import KanbanBoard from "../component/kanban/kanbanBoard";
import type {
  Task,
  TaskStatus,
} from "../component/kanban/kanban.type";

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Operations Review",
    description: "Check service health and blockers",
    status: "todo",
    priority: "high",
    assignee: "Manager",
  },
  {
    id: 2,
    title: "Customer Support",
    description: "Respond to customer issues",
    status: "in-progress",
    priority: "medium",
    assignee: "Ops Team",
  },
  {
    id: 3,
    title: "Incident Summary",
    description: "Prepare recovery notes",
    status: "review",
    priority: "high",
    assignee: "Analyst",
  },
  {
    id: 4,
    title: "Closure Checklist",
    description: "Finalize operational handoff",
    status: "done",
    priority: "low",
  },
];

export default function OperationWorkspace() {
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
      <h1>Operation Workspace</h1>

      <KanbanBoard
        tasks={tasks}
        boardType="operation"
        onTaskMove={handleTaskMove}
      />
    </div>
  );
}
