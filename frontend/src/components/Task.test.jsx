import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Task from "./Task";

function buildTask(overrides = {}) {
  return {
    id: 1,
    title: "Buy groceries",
    description: "Milk, eggs, and bread",
    completed: false,
    ...overrides
  };
}

function renderTask(props) {
  return render(
    <ul>
      <Task
        pending={false}
        onToggleCompleted={jest.fn()}
        onDelete={jest.fn()}
        {...props}
      />
    </ul>
  );
}

describe("Task", () => {
  it("renders the title, description, and an unchecked checkbox", () => {
    renderTask({ task: buildTask() });

    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
    expect(screen.getByText("Milk, eggs, and bread")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("checks the checkbox and applies the completed style for a completed task", () => {
    renderTask({ task: buildTask({ completed: true }) });

    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("listitem")).toHaveClass("task-completed");
  });

  it("calls onToggleCompleted with the task when the checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggleCompleted = jest.fn();
    const task = buildTask();

    renderTask({ task, onToggleCompleted });
    await user.click(screen.getByRole("checkbox"));

    expect(onToggleCompleted).toHaveBeenCalledWith(task);
  });

  it("calls onDelete with the task when the Delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const task = buildTask();

    renderTask({ task, onDelete });
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(task);
  });

  it("disables the checkbox and the Delete button while pending", () => {
    renderTask({ task: buildTask(), pending: true });

    expect(screen.getByRole("checkbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });
});
