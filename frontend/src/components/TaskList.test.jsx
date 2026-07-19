import { render, screen } from "@testing-library/react";
import TaskList from "./TaskList";
import { fetchTasks } from "../api";

jest.mock("../api");

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
});
