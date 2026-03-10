import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await connectDB();
    const userCount = await User.countDocuments();

    return NextResponse.json({
      hasUsers: userCount > 0,
      userCount,
    });
  } catch (error) {
    console.error("Error checking users:", error);
    return NextResponse.json(
      { error: "Failed to check users" },
      { status: 500 }
    );
  }
}
