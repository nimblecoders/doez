import mongoose, { Schema, Document } from "mongoose";

export type ConnectionType = "ssh" | "winrm" | "http" | "https";
export type AuthMethod = "password" | "private-key" | "token";

export interface IServerConnection extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  connectionType: ConnectionType;
  host: string;
  port: number;
  username: string;
  authMethod: AuthMethod;
  auth: {
    // For password auth
    password?: string;
    // For private key auth
    privateKey?: string;
    privateKeyPassphrase?: string;
    // For token auth
    token?: string;
  };
  // SSH specific
  sshSettings?: {
    timeout?: number; // milliseconds
    readyTimeout?: number;
    strictHostKeyChecking?: boolean;
    knownHostsPath?: string;
  };
  // Connection testing
  isValid: boolean;
  lastValidated: Date | null;
  lastError?: string;
  // Metadata
  tags: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServerConnectionSchema = new Schema<IServerConnection>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Connection name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    connectionType: {
      type: String,
      enum: ["ssh", "winrm", "http", "https"],
      default: "ssh",
      required: true,
    },
    host: {
      type: String,
      required: [true, "Host is required"],
      trim: true,
    },
    port: {
      type: Number,
      required: [true, "Port is required"],
      min: 1,
      max: 65535,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
    },
    authMethod: {
      type: String,
      enum: ["password", "private-key", "token"],
      default: "password",
      required: true,
    },
    auth: {
      password: { type: String },
      privateKey: { type: String },
      privateKeyPassphrase: { type: String },
      token: { type: String },
    },
    sshSettings: {
      timeout: { type: Number, default: 30000 },
      readyTimeout: { type: Number, default: 20000 },
      strictHostKeyChecking: { type: Boolean, default: false },
      knownHostsPath: { type: String },
    },
    isValid: {
      type: Boolean,
      default: false,
    },
    lastValidated: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ServerConnectionSchema.index({ userId: 1, connectionType: 1 });
ServerConnectionSchema.index({ userId: 1, isDefault: 1 });
ServerConnectionSchema.index({ userId: 1, tags: 1 });
ServerConnectionSchema.index({ host: 1, port: 1 });

const ServerConnection =
  mongoose.models.ServerConnection ||
  mongoose.model<IServerConnection>(
    "ServerConnection",
    ServerConnectionSchema
  );

export default ServerConnection;
