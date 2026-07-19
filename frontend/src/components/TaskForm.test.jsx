import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskForm from "./TaskForm";
import { createTask } from "../api";

jest.mock("../api");

describe("TaskForm", () => {
  it("submits the title and description and clears the form on success", async () => {
    const user = userEvent.setup();
    const created = { id: 1, title: "New task", description: "Details", completed: false };
    const onCreated = jest.fn();
    createTask.mockResolvedValue(created);

    render(<TaskForm onCreated={onCreated} />);

    await user.type(screen.getByLabelText("Title"), "New task");
    await user.type(screen.getByLabelText("Description"), "Details");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
    expect(createTask).toHaveBeenCalledWith({ title: "New task", description: "Details" });
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Description")).toHaveValue("");
  });

  it("shows the validation messages from a 422 rejection", async () => {
    const user = userEvent.setup();
    const error = new Error("Title can't be blank, Description can't be blank");
    error.status = 422;
    error.errors = ["Title can't be blank", "Description can't be blank"];
    createTask.mockRejectedValue(error);

    render(<TaskForm onCreated={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("Title can't be blank")).toBeInTheDocument();
    expect(screen.getByText("Description can't be blank")).toBeInTheDocument();
  });

  it("keeps the entered values when submission fails", async () => {
    const user = userEvent.setup();
    const error = new Error("Request failed with status 500");
    createTask.mockRejectedValue(error);

    render(<TaskForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Survives");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(await screen.findByText("Request failed with status 500")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Survives");
  });

  it("shows the submitting state while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveCreate;
    createTask.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
    );

    render(<TaskForm onCreated={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "New task");
    await user.type(screen.getByLabelText("Description"), "Details");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();

    resolveCreate({ id: 1, title: "New task", description: "Details", completed: false });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Add task" })).toBeEnabled()
    );
  });
});
