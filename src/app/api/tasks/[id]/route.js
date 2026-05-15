import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/auth";

export async function PUT(request, { params }) {
  try {
    const { id } = await params; // Await params in next 15+
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();
    const task = await Task.findById(id);
    
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Members can only update their own tasks, Head can update any.
    if (user.role !== "head" && task.assignedTo.toString() !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { status, newRemark, title, description, assignedTo, dueDate } = await request.json();
    
    if (status !== undefined) {
      task.status = status;
      if (status === "completed") {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
    }
    
    if (newRemark) {
      task.remarks.push({ text: newRemark, date: new Date() });
    }

    // Head can edit task details
    if (user.role === "head") {
      let edited = false;
      if (title !== undefined && task.title !== title) { task.title = title; edited = true; }
      if (description !== undefined && task.description !== description) { task.description = description; edited = true; }
      if (assignedTo !== undefined && task.assignedTo.toString() !== assignedTo) { task.assignedTo = assignedTo; edited = true; }
      if (dueDate !== undefined) { task.dueDate = dueDate; edited = true; }

      if (edited) {
        task.editedAt = new Date();
      }
    }

    await task.save();

    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== "head") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();
    await Task.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
