import { useEffect, useState } from "react";
import Task from "./Task";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchTasks() {
      try {
        const response = await fetch(`${process.env.API_URL}/api/v1/tasks`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        setTasks(await response.json());
        setLoading(false);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message);
        setLoading(false);
      }
    }

    fetchTasks();

    return () => controller.abort();
  }, []);

  if (loading) {
    return <p>Loading tasks…</p>;
  }

  if (error) {
    return <p className="error">Failed to load tasks: {error}</p>;
  }

  if (tasks.length === 0) {
    return <p>No tasks yet</p>;
  }

  return (
    <ul>
      {tasks.map((task) => (
        <Task key={task.id} task={task} />
      ))}
    </ul>
  );
}

export default TaskList;
