import mongoose, { Schema, Document } from "mongoose";

export type DeploymentStatus = 
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "rolled_back";

export interface DeploymentLog {
  timestamp: Date;
  level: "info" | "warning" | "error" | "success";
  message: string;
  step?: string;
}

export interface IDeployment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  templateName: string;
  credentialId: mongoose.Types.ObjectId;
  serverConnectionId?: mongoose.Types.ObjectId;
  provider: string;
  status: DeploymentStatus;
  parameters: Record<string, string | number | boolean>;
  currentStep: number;
  totalSteps: number;
  logs: DeploymentLog[];
  result?: {
    serverId?: string;
    serverIp?: string;
    serverUrl?: string;
    additionalInfo?: Record<string, unknown>;
  };
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  level: { 
    type: String, 
    enum: ["info", "warning", "error", "success"], 
    required: true 
  },
  message: { type: String, required: true },
  step: { type: String },
}, { _id: false });

const DeploymentSchema = new Schema<IDeployment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    credentialId: {
      type: Schema.Types.ObjectId,
      ref: "CloudCredential",
      required: true,
    },
    serverConnectionId: {
      type: Schema.Types.ObjectId,
      ref: "ServerConnection",
    },
    provider: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "cancelled", "rolled_back"],
      default: "pending",
    },
    parameters: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    totalSteps: {
      type: Number,
      default: 0,
    },
    logs: [DeploymentLogSchema],
    result: {
      serverId: { type: String },
      serverIp: { type: String },
      serverUrl: { type: String },
      additionalInfo: { type: Map, of: Schema.Types.Mixed },
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for querying
DeploymentSchema.index({ userId: 1, createdAt: -1 });
DeploymentSchema.index({ status: 1 });

const Deployment =
  mongoose.models.Deployment ||
  mongoose.model<IDeployment>("Deployment", DeploymentSchema);

export default Deployment;
