const API_URL = process.env.API_URL;

class ApiError extends Error {
  constructor(status, errors) {
    super(errors.join(", "));
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, options = {}) {
  const { body, ...fetchOptions } = options;

  if (body !== undefined) {
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, fetchOptions);

  if (!response.ok) {
    throw new ApiError(response.status, await readErrors(response));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function readErrors(response) {
  try {
    const data = await response.json();
    if (Array.isArray(data.errors)) {
      return data.errors;
    }
  } catch {
    // Body wasn't the JSON error envelope; fall through to the generic message.
  }
  return [`Request failed with status ${response.status}`];
}

function fetchTasks(signal) {
  return request("/api/v1/tasks", { signal });
}

function createTask(attributes) {
  return request("/api/v1/tasks", { method: "POST", body: { task: attributes } });
}

function updateTask(id, attributes) {
  return request(`/api/v1/tasks/${id}`, { method: "PATCH", body: { task: attributes } });
}

function deleteTask(id) {
  return request(`/api/v1/tasks/${id}`, { method: "DELETE" });
}

export { ApiError, fetchTasks, createTask, updateTask, deleteTask };
