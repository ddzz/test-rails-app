import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskList from "./TaskList";
import { fetchTasks, createTask, updateTask, deleteTask } from "../api";

jest.mock("../api");

const REMOVED_MESSAGE =
  "That task no longer exists on the server, so it was removed from the list.";

function buildTask(overrides = {}) {
  return {
    id: 1,
    title: "Buy groceries",
    description: "Milk, eggs, and bread",
    completed: false,
    ...overrides
  };
}

function notFoundError() {
  const error = new Error("Task not found");
  error.status = 404;
  error.errors = ["Task not found"];
  return error;
}

async function renderWithTask(task = buildTask()) {
  fetchTasks.mockResolvedValue([task]);
  render(<TaskList />);
  await screen.findByRole("checkbox");
  return task;
}

describe("TaskList", () => {
  it("shows the loading state and then the fetched tasks", async () => {
    fetchTasks.mockResolvedValue([
      { id: 1, title: "First task", description: "One", completed: false },
      { id: 2, title: "Second task", description: "Two", completed: true }
    ]);

    render(<TaskList />);

    expect(screen.getByText("Loading tasks…")).toBeInTheDocument();
    expect(await screen.findByText("First task")).toBeInTheDocument();
    expect(screen.getByText("Second task")).toBeInTheDocument();
  });

  it("shows the empty state when there are no tasks", async () => {
    fetchTasks.mockResolvedValue([]);

    render(<TaskList />);

    expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
  });

  it("shows the error state when loading fails", async () => {
    fetchTasks.mockRejectedValue(new Error("Request failed with status 500"));

    render(<TaskList />);

    expect(
      await screen.findByText("Failed to load tasks: Request failed with status 500")
    ).toBeInTheDocument();
  });

  describe("toggling a task", () => {
    it("updates the checkbox from the response on success", async () => {
      const user = userEvent.setup();
      const task = await renderWithTask();
      updateTask.mockResolvedValue({ ...task, completed: true });

      await user.click(screen.getByRole("checkbox"));

      await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
      expect(updateTask).toHaveBeenCalledWith(task.id, { completed: true });
    });

    it("disables the row's controls while the request is in flight", async () => {
      const user = userEvent.setup();
      const task = await renderWithTask();
      let resolveUpdate;
      updateTask.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          })
      );

      await user.click(screen.getByRole("checkbox"));

      expect(screen.getByRole("checkbox")).toBeDisabled();
      expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();

      resolveUpdate({ ...task, completed: true });

      await waitFor(() => expect(screen.getByRole("checkbox")).toBeEnabled());
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });

    it("removes the task and explains when the server returns 404", async () => {
      const user = userEvent.setup();
      await renderWithTask();
      updateTask.mockRejectedValue(notFoundError());

      expect(screen.getByText("Buy groceries")).toBeInTheDocument();
      await user.click(screen.getByRole("checkbox"));

      await waitFor(() =>
        expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument()
      );
      expect(screen.getByText(REMOVED_MESSAGE)).toBeInTheDocument();
    });

    it("keeps the task and shows the error when the request fails", async () => {
      const user = userEvent.setup();
      await renderWithTask();
      updateTask.mockRejectedValue(new Error("Request failed with status 500"));

      await user.click(screen.getByRole("checkbox"));

      expect(await screen.findByText("Request failed with status 500")).toBeInTheDocument();
      expect(screen.getByText("Buy groceries")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeEnabled();
      expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    });
  });

  describe("deleting a task", () => {
    it("removes the task on success", async () => {
      const user = userEvent.setup();
      const task = await renderWithTask();
      deleteTask.mockResolvedValue(null);

      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() =>
        expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument()
      );
      expect(deleteTask).toHaveBeenCalledWith(task.id);
      expect(screen.getByText("No tasks yet")).toBeInTheDocument();
    });

    it("removes the task silently when the server returns 404", async () => {
      const user = userEvent.setup();
      await renderWithTask();
      deleteTask.mockRejectedValue(notFoundError());

      expect(screen.getByText("Buy groceries")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Delete" }));

      await waitFor(() =>
        expect(screen.queryByText("Buy groceries")).not.toBeInTheDocument()
      );
      expect(screen.queryByText(REMOVED_MESSAGE)).not.toBeInTheDocument();
    });
  });

  describe("creating a task", () => {
    it("appends the created task from the response", async () => {
      const user = userEvent.setup();
      fetchTasks.mockResolvedValue([]);
      const created = buildTask({ id: 7, title: "Brand new task", description: "Fresh" });
      createTask.mockResolvedValue(created);

      render(<TaskList />);
      expect(await screen.findByText("No tasks yet")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Title"), "Brand new task");
      await user.type(screen.getByLabelText("Description"), "Fresh");
      await user.click(screen.getByRole("button", { name: "Add task" }));

      expect(await screen.findByText("Brand new task")).toBeInTheDocument();
      expect(screen.queryByText("No tasks yet")).not.toBeInTheDocument();
    });
  });
});
