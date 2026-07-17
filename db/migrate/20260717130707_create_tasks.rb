class CreateTasks < ActiveRecord::Migration[8.1]
  def change
    create_table :tasks do |t|
      t.string :title
      t.string :description, null: false
      t.boolean :completed, default: false, null: false

      t.timestamps
    end
  end
end
