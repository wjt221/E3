import type Anthropic from "@anthropic-ai/sdk";

// =============================================================================
// E3 AI Operating Partner — Claude Tool Definitions
// These tools let the AI Operating Partner create structured artifacts,
// extract action items, log risks, and gather context.
// =============================================================================

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "create_artifact",
    description:
      "Create or update a structured business artifact for the company workspace. Use this whenever you have enough information to produce a meaningful deliverable — don't just describe it in prose. The artifact is saved to the company workspace and shown to the user.",
    input_schema: {
      type: "object" as const,
      properties: {
        type: {
          type: "string",
          enum: [
            "company_profile",
            "value_creation_thesis",
            "strategic_priorities",
            "execution_plan",
            "kpi_tree",
            "risk_register",
            "board_update",
            "meeting_summary",
            "action_item_list",
            "specialist_recommendations",
            "playbook_entry",
          ],
          description: "The type of artifact to create",
        },
        title: {
          type: "string",
          description: "A clear, descriptive title for the artifact",
        },
        content: {
          type: "object",
          description:
            "The structured content of the artifact. Must match the schema for the artifact type. Include a 'type' field matching the artifact type.",
          additionalProperties: true,
        },
        rationale: {
          type: "string",
          description:
            "Brief explanation of why you are creating this artifact now and what triggered it",
        },
      },
      required: ["type", "title", "content"],
    },
  },
  {
    name: "extract_action_items",
    description:
      "Extract and save action items mentioned or implied in the conversation. Use this whenever you detect commitments, tasks, or next steps — even if not explicitly labeled as action items. Extract them immediately rather than waiting.",
    input_schema: {
      type: "object" as const,
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Clear, specific description of what needs to be done",
              },
              owner: {
                type: "string",
                description: "Who is responsible (use name or role if name unknown)",
              },
              due_date: {
                type: "string",
                description: "Due date in YYYY-MM-DD format, or null if not specified",
              },
              priority: {
                type: "string",
                enum: ["high", "medium", "low"],
                description: "Priority based on urgency and importance",
              },
              notes: {
                type: "string",
                description: "Any additional context or dependencies",
              },
            },
            required: ["title", "priority"],
          },
          minItems: 1,
        },
        source_context: {
          type: "string",
          description: "Brief description of where these action items came from",
        },
      },
      required: ["items"],
    },
  },
  {
    name: "add_risk",
    description:
      "Add a material business risk to the company risk register. Use this when you identify a risk that is significant enough to track — not every uncertainty, but ones that could materially impact the business.",
    input_schema: {
      type: "object" as const,
      properties: {
        risks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [
                  "strategic",
                  "financial",
                  "operational",
                  "market",
                  "talent",
                  "legal",
                  "technology",
                ],
              },
              description: {
                type: "string",
                description: "Clear description of the risk and why it matters",
              },
              likelihood: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              impact: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              owner: {
                type: "string",
                description: "Who should own this risk",
              },
              mitigation: {
                type: "string",
                description: "Recommended mitigation actions",
              },
            },
            required: ["category", "description", "likelihood", "impact"],
          },
        },
      },
      required: ["risks"],
    },
  },
  {
    name: "update_company_profile",
    description:
      "Update the company's basic profile information when you learn new factual information about the company (industry, stage, employee count, etc.).",
    input_schema: {
      type: "object" as const,
      properties: {
        updates: {
          type: "object",
          properties: {
            industry: { type: "string" },
            stage: {
              type: "string",
              enum: ["pre_revenue", "early_stage", "growth", "scale", "mature"],
            },
            description: { type: "string" },
            employee_count: { type: "number" },
            revenue_range: { type: "string" },
            website: { type: "string" },
            founded_year: { type: "number" },
          },
          additionalProperties: false,
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "ask_clarifying_question",
    description:
      "Flag that you need specific information to give better guidance. Use this to structure your question clearly and indicate what decision or analysis it unblocks. Ask one focused question at a time.",
    input_schema: {
      type: "object" as const,
      properties: {
        question: {
          type: "string",
          description: "The specific question you need answered",
        },
        why_it_matters: {
          type: "string",
          description: "What analysis or recommendation this will unlock",
        },
        category: {
          type: "string",
          enum: [
            "financial",
            "strategic",
            "operational",
            "market",
            "team",
            "product",
            "customer",
          ],
        },
      },
      required: ["question", "why_it_matters", "category"],
    },
  },
];

// Tool input types for type-safe handling

export interface CreateArtifactInput {
  type: string;
  title: string;
  content: Record<string, unknown>;
  rationale?: string;
}

export interface ExtractActionItemsInput {
  items: Array<{
    title: string;
    owner?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    notes?: string;
  }>;
  source_context?: string;
}

export interface AddRiskInput {
  risks: Array<{
    category: string;
    description: string;
    likelihood: "high" | "medium" | "low";
    impact: "high" | "medium" | "low";
    owner?: string;
    mitigation?: string;
  }>;
}

export interface UpdateCompanyProfileInput {
  updates: {
    industry?: string;
    stage?: string;
    description?: string;
    employee_count?: number;
    revenue_range?: string;
    website?: string;
    founded_year?: number;
  };
}

export interface AskClarifyingQuestionInput {
  question: string;
  why_it_matters: string;
  category: string;
}
