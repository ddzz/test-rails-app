import { useEffect, useState } from "react";
import { fetchTasks, updateTask, deleteTask } from "../api";
import Task from "./Task";
import TaskForm from "./TaskForm";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        setTasks(await fetchTasks(controller.signal));
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setLoadError(err.message);
        setLoading(false);
      }
    }

    loadTasks();

    return () => controller.abort();
  }, []);

  function handleCreated(task) {
    setTasks((current) => [...current, task]);
  }

  async function handleToggleCompleted(task) {
    try {
      const updated = await updateTask(task.id, { completed: !task.completed });
      setTasks((current) =>
        current.map((existing) => (existing.id === updated.id ? updated : existing))
      );
      setActionError(null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(task) {
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((existing) => existing.id !== task.id));
      setActionError(null);
    } catch (err) {
      setActionError(err.message);
    }
  }

  function renderTasks() {
    if (loading) {
      return <p>Loading tasks…</p>;
    }

    if (loadError) {
      return <p className="error">Failed to load tasks: {loadError}</p>;
    }

    if (tasks.length === 0) {
      return <p>No tasks yet</p>;
    }

    return (
      <ul className="task-list">
        {tasks.map((task) => (
          <Task
            key={task.id}
            task={task}
            onToggleCompleted={handleToggleCompleted}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    );
  }

  return (
    <section>
      <TaskForm onCreated={handleCreated} />
      {actionError && <p className="error">{actionError}</p>}
      {renderTasks()}
    </section>
  );
}

export default TaskList;
