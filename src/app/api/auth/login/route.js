import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username });
    if (!user) {
      // Create head user if it doesn't exist and the username is 'head'
      if (username === "head") {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
          name: "Head Administrator",
          username,
          password: hashedPassword,
          role: "head",
        });
        const token = signToken({ id: newUser._id, role: newUser.role });
        const response = NextResponse.json({ user: { id: newUser._id, name: newUser.name, username: newUser.username, role: newUser.role } }, { status: 200 });
        response.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 86400 });
        return response;
      }
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ id: user._id, role: user.role });
    const response = NextResponse.json({ user: { id: user._id, name: user.name, username: user.username, role: user.role } }, { status: 200 });
    response.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 86400 });
    
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
