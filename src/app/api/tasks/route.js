import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // Send Task Assignment Email
    if (resend) {
      try {
        const assignee = await User.findById(assignedTo);
        if (assignee && assignee.email) {
          await resend.emails.send({
            from: "TaskFlow <onboarding@resend.dev>",
            to: assignee.email,
            subject: `New Task Assigned: ${title}`,
            html: `
              <h2>New Task Assigned: ${title}</h2>
              <p><strong>Description:</strong> ${description || 'No description provided.'}</p>
              <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
              <br/>
              <p>Please log in to TaskFlow to view details and mark it as completed or add remarks.</p>
            `
          });
        }
      } catch (emailError) {
        console.error("Failed to send task email:", emailError);
      }
    }

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
