import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";
import { createSession } from "@/lib/auth";
import { VALIDATION, ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_EMAIL },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PASSWORD_TOO_SHORT },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if this is the first user (will be admin)
    const userCount = await User.countDocuments();

    // If users already exist, only admins can add new users
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Registration is closed. Please contact an administrator." },
        { status: 403 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (first user is admin)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    // Create session
    await createSession({
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
