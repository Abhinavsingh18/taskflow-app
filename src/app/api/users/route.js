import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = verifyToken(token);
    if (!user || user.role !== "head") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();
    const users = await User.find({ role: "member" }).select("-password");
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const authUser = verifyToken(token);
    if (!authUser || authUser.role !== "head") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await dbConnect();
    const { name, username, password } = await request.json();
    
    if (!name || !username || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      username,
      password: hashedPassword,
      role: "member"
    });

    return NextResponse.json({ user: { id: newUser._id, name: newUser.name, username: newUser.username, role: newUser.role } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
