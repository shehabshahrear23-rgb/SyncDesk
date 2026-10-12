
import { useEffect, useState } from "react";
import type {
  KanbanBoardProps,
  Task,
  TaskStatus,
} from "./kanban.type";
import "./kanbanBoard.css";

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "In Review" },
  { id: "done", title: "Done" },
];

export default function KanbanBoard({
  tasks,
  boardType,
  onTaskMove,
}: KanbanBoardProps) {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [draggedId, setDraggedId] =
    useState<Task["id"] | null>(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  async function moveTask(
    id: Task["id"],
    newStatus: TaskStatus
  ) {
    const previousTasks = localTasks;
    const task = previousTasks.find((item) => item.id === id);

    if (!task || task.status === newStatus) return;

    setLocalTasks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: newStatus } : item
      )
    );

    try {
      await onTaskMove(id, newStatus);
    } catch (error) {
      setLocalTasks(previousTasks);
      console.error("Task update failed:", error);
    }
  }

  return (
    <section className="kanban-board" data-board-type={boardType}>
      {columns.map((column) => {
        const columnTasks = localTasks.filter(
          (task) => task.status === column.id
        );

        return (
          <div
            className="kanban-column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();

              if (draggedId !== null) {
                void moveTask(draggedId, column.id);
              }

              setDraggedId(null);
            }}
          >
            <header className="kanban-column-header">
              <h3>{column.title}</h3>
              <span>{columnTasks.length}</span>
            </header>

            <div className="kanban-column-content">
              {columnTasks.map((task) => (
                <article
                  className="kanban-card"
                  key={task.id}
                  draggable
                  onDragStart={() => setDraggedId(task.id)}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <h4>{task.title}</h4>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  {task.priority && (
                    <span
                      className={`priority priority-${task.priority}`}
                    >
                      {task.priority}
                    </span>
                  )}

                  {task.assignee && <small>{task.assignee}</small>}
                </article>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
