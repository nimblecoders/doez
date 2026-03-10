import mongoose, { Schema, Document } from "mongoose";

export type CloudProvider = "aws" | "gcp" | "azure" | "digitalocean";

export interface ICloudCredential extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  provider: CloudProvider;
  name: string;
  credentials: {
    // AWS
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    // GCP
    projectId?: string;
    serviceAccountKey?: string;
    // Azure
    subscriptionId?: string;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    // DigitalOcean
    apiToken?: string;
  };
  isDefault: boolean;
  isValid: boolean;
  lastValidated: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CloudCredentialSchema = new Schema<ICloudCredential>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: String,
      enum: ["aws", "gcp", "azure", "digitalocean"],
      required: true,
    },
    name: {
      type: String,
      required: [true, "Credential name is required"],
      trim: true,
    },
    credentials: {
      // AWS
      accessKeyId: { type: String },
      secretAccessKey: { type: String },
      region: { type: String },
      // GCP
      projectId: { type: String },
      serviceAccountKey: { type: String },
      // Azure
      subscriptionId: { type: String },
      tenantId: { type: String },
      clientId: { type: String },
      clientSecret: { type: String },
      // DigitalOcean
      apiToken: { type: String },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isValid: {
      type: Boolean,
      default: false,
    },
    lastValidated: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default credential per provider per user
CloudCredentialSchema.index({ userId: 1, provider: 1, isDefault: 1 });

const CloudCredential =
  mongoose.models.CloudCredential ||
  mongoose.model<ICloudCredential>("CloudCredential", CloudCredentialSchema);

export default CloudCredential;
