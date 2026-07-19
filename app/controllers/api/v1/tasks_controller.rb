class Api::V1::TasksController < ApplicationController
  before_action :set_task, only: %i[ show update destroy ]

  rescue_from ActiveRecord::RecordNotFound do
    render json: { errors: [ "Task not found" ] }, status: :not_found
  end

  rescue_from ActionController::ParameterMissing do |exception|
    render json: { errors: [ exception.message ] }, status: :bad_request
  end

  def index
    render json: Task.order(:id)
  end

  def show
    render json: @task
  end

  def create
    task = Task.new(task_params)

    if task.save
      render json: task, status: :created
    else
      render json: { errors: task.errors.full_messages }, status: :unprocessable_content
    end
  end

  def update
    if @task.update(task_params)
      render json: @task
    else
      render json: { errors: @task.errors.full_messages }, status: :unprocessable_content
    end
  end

  def destroy
    @task.destroy!
    head :no_content
  end

  private

  def set_task
    @task = Task.find(params[:id])
  end

  def task_params
    params.expect(task: [ :title, :description, :completed ])
  end
end
