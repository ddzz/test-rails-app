import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { fetchTasks } from "./api";

jest.mock("./api");

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

beforeEach(() => {
  fetchTasks.mockResolvedValue([]);
});

test("renders the home page at /", () => {
  renderAt("/");

  expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Tasks" })).not.toBeInTheDocument();
  expect(fetchTasks).not.toHaveBeenCalled();
});

test("renders the tasks page at /tasks", async () => {
  renderAt("/tasks");

  expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
});

test("navigates from home to tasks via the nav link", async () => {
  const user = userEvent.setup();
  renderAt("/");

  await user.click(screen.getByRole("link", { name: "Tasks" }));

  expect(screen.getByRole("heading", { name: "Tasks" })).toBeInTheDocument();
  expect(await screen.findByText("No tasks yet")).toBeInTheDocument();
});

test("navigates from tasks back to home via the nav link", async () => {
  const user = userEvent.setup();
  renderAt("/tasks");
  await screen.findByText("No tasks yet");

  await user.click(screen.getByRole("link", { name: "Home" }));

  expect(screen.getByRole("heading", { name: "Home" })).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Tasks" })).not.toBeInTheDocument();
});

test("shows the not-found page for unknown paths", () => {
  renderAt("/nonsense");

  expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to the home page" })).toBeInTheDocument();
});
