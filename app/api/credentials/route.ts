import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import CloudCredential from "@/lib/models/cloud-credential";
import ActivityLog from "@/lib/models/activity-log";

export async function GET() {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const credentials = await CloudCredential.find({ userId: session.userId })
      .select("-credentials.secretAccessKey -credentials.serviceAccountKey -credentials.clientSecret -credentials.apiToken")
      .sort({ createdAt: -1 });

    return NextResponse.json({ credentials });
  } catch (error) {
    console.error("Fetch credentials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, name, credentials, isDefault } = body;

    if (!provider || !name || !credentials) {
      return NextResponse.json(
        { error: "Provider, name, and credentials are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // If setting as default, unset other defaults for this provider
    if (isDefault) {
      await CloudCredential.updateMany(
        { userId: session.userId, provider, isDefault: true },
        { isDefault: false }
      );
    }

    const credential = new CloudCredential({
      userId: session.userId,
      provider,
      name,
      credentials,
      isDefault: isDefault || false,
    });

    await credential.save();

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "credential.created",
      description: `Added ${provider.toUpperCase()} credential: ${name}`,
      metadata: { provider, credentialId: credential._id },
    });

    return NextResponse.json({
      message: "Credential added successfully",
      credential: {
        _id: credential._id,
        provider: credential.provider,
        name: credential.name,
        isDefault: credential.isDefault,
        isValid: credential.isValid,
        createdAt: credential.createdAt,
      },
    });
  } catch (error) {
    console.error("Create credential error:", error);
    return NextResponse.json(
      { error: "Failed to create credential" },
      { status: 500 }
    );
  }
}
