// Common error messages used across APIs
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already in use",
  UNAUTHORIZED: "Unauthorized - please log in",
  SESSION_EXPIRED: "Session expired - please log in again",
  INVALID_TOKEN: "Invalid or expired token",

  // Validation errors
  INVALID_REQUEST: "Invalid request",
  MISSING_FIELDS: "Missing required fields",
  INVALID_EMAIL: "Invalid email format",
  PASSWORD_TOO_SHORT: "Password must be at least 6 characters",
  INVALID_PASSWORD: "Invalid password",

  // Resource errors
  NOT_FOUND: "Resource not found",
  ALREADY_EXISTS: "Resource already exists",
  CONFLICT: "Resource conflict",

  // Permission errors
  FORBIDDEN: "You don't have permission to access this resource",
  ADMIN_ONLY: "This action is admin only",

  // Database errors
  DATABASE_ERROR: "Database error occurred",
  CONNECTION_ERROR: "Could not connect to database",

  // Server errors
  INTERNAL_ERROR: "Internal server error",
  METHOD_NOT_ALLOWED: "Method not allowed",

  // Cloud credential errors
  CREDENTIAL_NOT_FOUND: "Cloud credential not found",
  INVALID_CREDENTIAL_TYPE: "Invalid cloud provider type",
  CREDENTIAL_VALIDATION_FAILED: "Unable to validate credential",

  // Template errors
  TEMPLATE_NOT_FOUND: "Template not found",
  INVALID_PARAMETERS: "Invalid template parameters",
  TEMPLATE_VALIDATION_FAILED: "Template validation failed",

  // Deployment errors
  DEPLOYMENT_NOT_FOUND: "Deployment not found",
  DEPLOYMENT_FAILED: "Deployment failed",
  INVALID_DEPLOYMENT_STATE: "Invalid deployment state",
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User roles
export const USER_ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

// Cloud provider types
export const CLOUD_PROVIDERS = {
  AWS: "aws",
  GCP: "gcp",
  AZURE: "azure",
  DIGITALOCEAN: "digitalocean",
} as const;

// Template categories
export const TEMPLATE_CATEGORIES = {
  SERVER: "server",
  DATABASE: "database",
  CACHE: "cache",
  QUEUE: "queue",
  MONITORING: "monitoring",
  APPLICATION: "application",
  CONTAINER: "container",
  SECURITY: "security",
} as const;

// Deployment statuses
export const DEPLOYMENT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// Activity log actions
export const ACTIVITY_ACTIONS = {
  USER_CREATED: "user_created",
  USER_DELETED: "user_deleted",
  USER_UPDATED: "user_updated",
  LOGIN: "login",
  LOGOUT: "logout",
  CREDENTIAL_ADDED: "credential_added",
  CREDENTIAL_DELETED: "credential_deleted",
  TEMPLATE_CREATED: "template_created",
  TEMPLATE_UPDATED: "template_updated",
  TEMPLATE_DELETED: "template_deleted",
  DEPLOYMENT_CREATED: "deployment_created",
  DEPLOYMENT_COMPLETED: "deployment_completed",
  DEPLOYMENT_FAILED: "deployment_failed",
} as const;

// Session configuration
export const SESSION_CONFIG = {
  DURATION_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  DURATION_DAYS: 7,
  COOKIE_NAME: "session",
  COOKIE_PATH: "/",
  SAME_SITE: "lax" as const,
} as const;

// Validation rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 2,
  JWT_SECRET_MIN_LENGTH: 32,
  API_KEY_LENGTH: 32,
} as const;

// Rate limiting (future use)
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_REQUESTS_PER_MINUTE: 100,
} as const;
