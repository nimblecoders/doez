/**
 * Template Manager Service
 * Loads and manages deployment templates from JSON files
 */

import fs from "fs";
import path from "path";

export interface TemplateParameter {
  name: string;
  type: "string" | "number" | "select" | "boolean";
  description: string;
  required: boolean;
  default?: string | number | boolean;
  options?: string[];
  secret?: boolean;
}

export interface DeploymentStep {
  name: string;
  description?: string;
  command: string;
  continueOnError?: boolean;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  provider: string;
  tags: string[];
  author?: {
    name: string;
    email?: string;
  };
  estimatedTime: string;
  usageCount: number;
}

export interface DeploymentTemplate extends TemplateMetadata {
  parameters: TemplateParameter[];
  steps: DeploymentStep[];
  requirements?: string[];
  postDeployment?: {
    healthCheck?: {
      enabled: boolean;
      endpoint?: string;
      command?: string;
      interval?: number;
      timeout?: number;
      retries?: number;
    };
    notifications?: Array<{
      type: string;
      message: string;
    }>;
  };
  rollbackSteps?: DeploymentStep[];
  documentation?: {
    title: string;
    description: string;
    sections?: Array<{
      title: string;
      content: string;
    }>;
  };
}

export class TemplateManager {
  private templateDir: string;
  private templates = new Map<string, DeploymentTemplate>();

  constructor(templateDir: string = "./templates") {
    this.templateDir = templateDir;
  }

  /**
   * Load all templates from directory structure
   */
  async loadAllTemplates(): Promise<void> {
    try {
      if (!fs.existsSync(this.templateDir)) {
        console.warn(`Template directory not found: ${this.templateDir}`);
        return;
      }

      const categories = fs.readdirSync(this.templateDir);

      for (const category of categories) {
        const categoryPath = path.join(this.templateDir, category);
        const stat = fs.statSync(categoryPath);

        if (!stat.isDirectory()) continue;

        const templateFiles = fs
          .readdirSync(categoryPath)
          .filter((file) => file.endsWith(".json"));

        for (const file of templateFiles) {
          const filePath = path.join(categoryPath, file);
          await this.loadTemplate(filePath);
        }
      }

      console.log(`Loaded ${this.templates.size} templates`);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  }

  /**
   * Load a single template from JSON file
   */
  private async loadTemplate(filePath: string): Promise<void> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const template: DeploymentTemplate = JSON.parse(content);

      if (!template.id) {
        console.warn(`Template missing id in ${filePath}`);
        return;
      }

      this.templates.set(template.id, template);
    } catch (error) {
      console.error(`Error loading template from ${filePath}:`, error);
    }
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId: string): DeploymentTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * List all templates
   */
  listTemplates(): DeploymentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Filter templates by category
   */
  getByCategory(category: string): DeploymentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.category === category
    );
  }

  /**
   * Filter templates by tags
   */
  searchByTags(tags: string[]): DeploymentTemplate[] {
    return Array.from(this.templates.values()).filter((template) =>
      tags.some((tag) => template.tags.includes(tag))
    );
  }

  /**
   * Filter templates by provider
   */
  getByProvider(provider: string): DeploymentTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) => t.provider === provider || t.provider === "any"
    );
  }

  /**
   * Get available categories
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.templates.forEach((t) => categories.add(t.category));
    return Array.from(categories).sort();
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    const providers = new Set<string>();
    this.templates.forEach((t) => {
      if (t.provider !== "any") {
        providers.add(t.provider);
      }
    });
    return Array.from(providers).sort();
  }

  /**
   * Validate template parameters
   */
  validateParameters(
    template: DeploymentTemplate,
    params: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const param of template.parameters) {
      if (param.required && !(param.name in params)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in params) {
        const value = params[param.name];

        if (param.type === "number" && typeof value !== "number") {
          errors.push(
            `Parameter ${param.name} must be a number, got ${typeof value}`
          );
        }

        if (
          param.type === "select" &&
          param.options &&
          !param.options.includes(String(value))
        ) {
          errors.push(
            `Parameter ${param.name} must be one of: ${param.options.join(", ")}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Interpolate parameters into commands
   */
  interpolateCommands(
    steps: DeploymentStep[],
    params: Record<string, unknown>
  ): DeploymentStep[] {
    return steps.map((step) => ({
      ...step,
      command: this.interpolateString(step.command, params),
      description: step.description
        ? this.interpolateString(step.description, params)
        : undefined,
    }));
  }

  /**
   * Replace variables in string with parameter values
   */
  private interpolateString(
    str: string,
    params: Record<string, unknown>
  ): string {
    let result = str;

    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\$\\{${key}\\}`, "g");
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(
    templateId: string,
    outputPath: string
  ): Promise<boolean> {
    const template = this.getTemplate(templateId);

    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return false;
    }

    try {
      fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
      return true;
    } catch (error) {
      console.error(`Error exporting template: ${error}`);
      return false;
    }
  }

  /**
   * Import template from JSON file
   */
  async importTemplate(filePath: string): Promise<boolean> {
    try {
      await this.loadTemplate(filePath);
      return true;
    } catch (error) {
      console.error(`Error importing template: ${error}`);
      return false;
    }
  }

  /**
   * Get template stats
   */
  getStats() {
    const templates = this.listTemplates();

    return {
      total: templates.length,
      categories: this.getCategories(),
      providers: this.getProviders(),
      byCategory: Object.fromEntries(
        this.getCategories().map((cat) => [
          cat,
          this.getByCategory(cat).length,
        ])
      ),
    };
  }
}

// Global singleton instance
let globalTemplateManager: TemplateManager | null = null;

export function getTemplateManager(): TemplateManager {
  if (!globalTemplateManager) {
    globalTemplateManager = new TemplateManager(
      process.env.TEMPLATE_DIR || "./templates"
    );
  }
  return globalTemplateManager;
}

export default TemplateManager;
