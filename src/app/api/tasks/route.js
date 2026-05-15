import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { verifyToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    let tasks;
    if (user.role === "head") {
      tasks = await Task.find().populate("assignedTo", "name username").sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ assignedTo: user.id }).sort({ createdAt: -1 });
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== "head") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();
    const { title, description, assignedTo, dueDate } = await request.json();

    if (!title || !assignedTo || !dueDate) {
      return NextResponse.json({ error: "Title, Assignee, and Due Date required" }, { status: 400 });
    }

    const newTask = await Task.create({
      title,
      description,
      assignedTo,
      dueDate
    });

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
