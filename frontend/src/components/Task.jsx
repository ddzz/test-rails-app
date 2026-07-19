function Task({ task, pending, onToggleCompleted, onDelete }) {
  const className = task.completed ? "task task-completed" : "task";

  return (
    <li className={className}>
      <div className="task-row">
        <label className="task-title">
          <input
            type="checkbox"
            checked={task.completed}
            disabled={pending}
            onChange={() => onToggleCompleted(task)}
          />
          {task.title}
        </label>
        <button type="button" disabled={pending} onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
      <p className="task-description">{task.description}</p>
    </li>
  );
}

export default Task;
