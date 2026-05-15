import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a task title"],
  },
  description: {
    type: String,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  dueDate: {
    type: Date,
    required: [true, "Please provide a due date"],
  },
  status: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  remarks: [{
    text: String,
    date: {
      type: Date,
      default: Date.now,
    }
  }],
  completedAt: {
    type: Date,
  },
  editedAt: {
    type: Date,
  }
}, { timestamps: true });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
