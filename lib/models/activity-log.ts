import mongoose, { Schema, Document } from "mongoose";

export type ActivityAction = 
  | "user.login"
  | "user.logout"
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "credential.created"
  | "credential.updated"
  | "credential.deleted"
  | "credential.validated"
  | "template.created"
  | "template.updated"
  | "template.deleted"
  | "deployment.started"
  | "deployment.completed"
  | "deployment.failed"
  | "deployment.cancelled";

export interface IActivityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: [
        "user.login",
        "user.logout",
        "user.created",
        "user.updated",
        "user.deleted",
        "credential.created",
        "credential.updated",
        "credential.deleted",
        "credential.validated",
        "template.created",
        "template.updated",
        "template.deleted",
        "deployment.started",
        "deployment.completed",
        "deployment.failed",
        "deployment.cancelled",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1 });
ActivityLogSchema.index({ createdAt: -1 });

const ActivityLog =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
