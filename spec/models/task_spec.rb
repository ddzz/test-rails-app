require "rails_helper"

RSpec.describe Task, type: :model do
  it "is valid with a title and a description" do
    expect(build(:task)).to be_valid
  end

  it "is invalid without a title" do
    task = build(:task, title: "")

    expect(task).not_to be_valid
    expect(task.errors.full_messages).to include("Title can't be blank")
  end

  it "is invalid without a description" do
    task = build(:task, description: "")

    expect(task).not_to be_valid
    expect(task.errors.full_messages).to include("Description can't be blank")
  end
end
