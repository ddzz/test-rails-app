function Task({ task, onToggleCompleted, onDelete }) {
  const className = task.completed ? "task task-completed" : "task";

  return (
    <li className={className}>
      <div className="task-row">
        <label className="task-title">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleCompleted(task)}
          />
          {task.title}
        </label>
        <button type="button" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
      <p className="task-description">{task.description}</p>
    </li>
  );
}

export default Task;
