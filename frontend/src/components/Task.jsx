function Task({ task }) {
  const className = task.completed ? "task task-completed" : "task";

  return (
    <li className={className}>
      <span className="task-title">
        {task.completed ? "✓" : "○"} {task.title}
      </span>
      <p className="task-description">{task.description}</p>
    </li>
  );
}

export default Task;
