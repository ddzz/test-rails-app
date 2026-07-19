require "rails_helper"

RSpec.describe "Api::V1::Tasks", type: :request do
  let(:task_keys) { %w[id title description completed created_at updated_at] }
  let(:not_found_body) { { "errors" => [ "Task not found" ] } }

  describe "GET /api/v1/tasks" do
    it "returns 200 with an empty array when there are no tasks" do
      get "/api/v1/tasks"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to eq([])
    end

    it "returns 200 with an array of task objects" do
      create_list(:task, 2)

      get "/api/v1/tasks"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_an(Array)
      expect(response.parsed_body.size).to eq(2)
      response.parsed_body.each do |task|
        expect(task.keys).to match_array(task_keys)
      end
    end

    it "returns tasks ordered by id" do
      older = create(:task)
      newer = create(:task)

      get "/api/v1/tasks"

      expect(response.parsed_body.map { |task| task["id"] }).to eq([ older.id, newer.id ])
    end
  end

  describe "GET /api/v1/tasks/:id" do
    it "returns 200 with the task" do
      task = create(:task)

      get "/api/v1/tasks/#{task.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.keys).to match_array(task_keys)
      expect(response.parsed_body).to include(
        "id" => task.id,
        "title" => task.title,
        "description" => task.description,
        "completed" => false
      )
    end

    it "returns 404 with an errors array for an unknown id" do
      get "/api/v1/tasks/0"

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq(not_found_body)
    end
  end

  describe "POST /api/v1/tasks" do
    it "returns 201 with the created task" do
      params = attributes_for(:task)

      expect {
        post "/api/v1/tasks", params: { task: params }
      }.to change(Task, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.keys).to match_array(task_keys)
      expect(response.parsed_body).to include(
        "title" => params[:title],
        "description" => params[:description],
        "completed" => false
      )
    end

    it "returns 422 with an errors array when title is blank" do
      params = attributes_for(:task, title: "")

      expect {
        post "/api/v1/tasks", params: { task: params }
      }.not_to change(Task, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Title can't be blank" ])
    end

    it "returns 422 with an errors array when description is blank" do
      params = attributes_for(:task, description: "")

      expect {
        post "/api/v1/tasks", params: { task: params }
      }.not_to change(Task, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Description can't be blank" ])
    end

    it "returns 400 with an errors array when the task param is missing" do
      post "/api/v1/tasks", params: {}

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body).to match("errors" => [ a_string_including("task") ])
    end
  end

  describe "PATCH /api/v1/tasks/:id" do
    it "returns 200 with the updated task" do
      task = create(:task)

      patch "/api/v1/tasks/#{task.id}", params: {
        task: { title: "New title", description: "New description", completed: true }
      }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.keys).to match_array(task_keys)
      expect(response.parsed_body).to include(
        "id" => task.id,
        "title" => "New title",
        "description" => "New description",
        "completed" => true
      )
    end

    it "returns 200 when updating a single attribute" do
      task = create(:task)

      patch "/api/v1/tasks/#{task.id}", params: { task: { completed: true } }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to include(
        "title" => task.title,
        "completed" => true
      )
    end

    it "returns 422 with an errors array when title is blank" do
      task = create(:task)

      expect {
        patch "/api/v1/tasks/#{task.id}", params: { task: { title: "" } }
      }.not_to change { task.reload.title }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Title can't be blank" ])
    end

    it "returns 422 with an errors array when description is blank" do
      task = create(:task)

      expect {
        patch "/api/v1/tasks/#{task.id}", params: { task: { description: "" } }
      }.not_to change { task.reload.description }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Description can't be blank" ])
    end

    it "returns 404 with an errors array for an unknown id" do
      patch "/api/v1/tasks/0", params: { task: { title: "New title" } }

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq(not_found_body)
    end
  end

  describe "DELETE /api/v1/tasks/:id" do
    it "returns 204 with no body and deletes the task" do
      task = create(:task)

      expect {
        delete "/api/v1/tasks/#{task.id}"
      }.to change(Task, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(response.body).to be_empty
    end

    it "returns 404 with an errors array for an unknown id" do
      delete "/api/v1/tasks/0"

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body).to eq(not_found_body)
    end
  end
end
