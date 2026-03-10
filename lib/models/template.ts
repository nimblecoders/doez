import mongoose, { Schema, Document } from "mongoose";

export type TemplateCategory = 
  | "server"
  | "database"
  | "cache"
  | "queue"
  | "monitoring"
  | "application"
  | "container"
  | "security";

export type TemplateProvider = "aws" | "gcp" | "azure" | "digitalocean" | "any";

export interface TemplateParameter {
  name: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  required: boolean;
  default?: string | number | boolean;
  secret?: boolean;
  options?: string[]; // For select type
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface TemplateStep {
  name: string;
  description?: string;
  command: string;
  continueOnError?: boolean;
}

export interface ITemplate extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  version: string;
  description: string;
  category: TemplateCategory;
  provider: TemplateProvider;
  icon?: string;
  parameters: TemplateParameter[];
  requirements: string[];
  steps: TemplateStep[];
  estimatedTime: number; // in minutes
  author: {
    userId: mongoose.Types.ObjectId;
    name: string;
  };
  isPublic: boolean;
  isVerified: boolean;
  usageCount: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TemplateParameterSchema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["string", "number", "boolean", "select"], 
    required: true 
  },
  label: { type: String, required: true },
  description: { type: String },
  required: { type: Boolean, default: false },
  default: { type: Schema.Types.Mixed },
  secret: { type: Boolean, default: false },
  options: [{ type: String }],
  validation: {
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String },
  },
}, { _id: false });

const TemplateStepSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  command: { type: String, required: true },
  continueOnError: { type: Boolean, default: false },
}, { _id: false });

const TemplateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    category: {
      type: String,
      enum: ["server", "database", "cache", "queue", "monitoring", "application", "container", "security"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["aws", "gcp", "azure", "digitalocean", "any"],
      required: true,
    },
    icon: {
      type: String,
    },
    parameters: [TemplateParameterSchema],
    requirements: [{ type: String }],
    steps: [TemplateStepSchema],
    estimatedTime: {
      type: Number,
      default: 5,
    },
    author: {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    tags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Create slug from name
TemplateSchema.pre("validate", function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Index for searching
TemplateSchema.index({ name: "text", description: "text", tags: "text" });
TemplateSchema.index({ category: 1, provider: 1 });

const Template =
  mongoose.models.Template ||
  mongoose.model<ITemplate>("Template", TemplateSchema);

export default Template;
