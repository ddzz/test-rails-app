import { useState } from "react";
import { createTask } from "../api";

function TaskForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const task = await createTask({ title, description });
      setTitle("");
      setDescription("");
      setErrors([]);
      onCreated(task);
    } catch (err) {
      setErrors(err.errors ?? [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      )}
      <label>
        Title
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Description
        <input
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? "Adding…" : "Add task"}
      </button>
    </form>
  );
}

export default TaskForm;
