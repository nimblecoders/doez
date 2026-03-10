import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import CloudCredential from "@/lib/models/cloud-credential";
import ActivityLog from "@/lib/models/activity-log";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const credential = await CloudCredential.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    await CloudCredential.deleteOne({ _id: id });

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "credential.deleted",
      description: `Deleted ${credential.provider.toUpperCase()} credential: ${credential.name}`,
      metadata: { provider: credential.provider },
    });

    return NextResponse.json({ message: "Credential deleted successfully" });
  } catch (error) {
    console.error("Delete credential error:", error);
    return NextResponse.json(
      { error: "Failed to delete credential" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, credentials, isDefault } = body;

    await connectDB();

    const credential = await CloudCredential.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!credential) {
      return NextResponse.json(
        { error: "Credential not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults for this provider
    if (isDefault) {
      await CloudCredential.updateMany(
        { userId: session.userId, provider: credential.provider, isDefault: true, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    if (name) credential.name = name;
    if (credentials) credential.credentials = { ...credential.credentials, ...credentials };
    if (typeof isDefault === "boolean") credential.isDefault = isDefault;

    await credential.save();

    // Log activity
    await ActivityLog.create({
      userId: session.userId,
      userName: session.name,
      action: "credential.updated",
      description: `Updated ${credential.provider.toUpperCase()} credential: ${credential.name}`,
      metadata: { provider: credential.provider, credentialId: credential._id },
    });

    return NextResponse.json({
      message: "Credential updated successfully",
      credential: {
        _id: credential._id,
        provider: credential.provider,
        name: credential.name,
        isDefault: credential.isDefault,
        isValid: credential.isValid,
        updatedAt: credential.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update credential error:", error);
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 }
    );
  }
}
