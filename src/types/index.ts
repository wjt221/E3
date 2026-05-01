// =============================================================================
// E3 AI Operating Partner — Shared TypeScript Types
// =============================================================================

// --- Identity & Auth ---

export type UserRole =
  | "super_admin"
  | "operating_partner"
  | "ceo"
  | "domain_specialist"
  | "board_member";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  org_id: string;
  company_id: string | null; // null for super_admin / operating_partner with multi-co access
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "growth" | "enterprise";
  created_at: string;
}

export interface Company {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  stage: CompanyStage | null;
  website: string | null;
  description: string | null;
  founded_year: number | null;
  employee_count: number | null;
  revenue_range: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanyStage =
  | "pre_revenue"
  | "early_stage"
  | "growth"
  | "scale"
  | "mature";

// --- Agent Modes ---

export type AgentMode =
  | "learn"
  | "diagnose"
  | "plan"
  | "cadence"
  | "board_prep"
  | "specialists"
  | "playbook";

export const AGENT_MODE_LABELS: Record<AgentMode, string> = {
  learn: "Learn the Business",
  diagnose: "Diagnose the Business",
  plan: "Build the Plan",
  cadence: "Run the Cadence",
  board_prep: "Prepare the Board",
  specialists: "Recommend Specialists",
  playbook: "Update the Playbook",
};

export const AGENT_MODE_DESCRIPTIONS: Record<AgentMode, string> = {
  learn: "Ingesting and understanding business context",
  diagnose: "Identifying issues, risks, and opportunities",
  plan: "Building strategic priorities and execution plans",
  cadence: "Reviewing progress and managing weekly execution",
  board_prep: "Preparing board materials and governance updates",
  specialists: "Identifying domain experts and advisors needed",
  playbook: "Capturing learnings into the living company playbook",
};

// --- Conversations & Messages ---

export interface Conversation {
  id: string;
  company_id: string;
  user_id: string;
  title: string | null;
  mode: AgentMode;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: SourceReference[];
  tool_calls: ToolCallRecord[] | null;
  mode: AgentMode | null;
  created_at: string;
}

export interface SourceReference {
  document_id: string;
  document_name: string;
  chunk_index: number;
  relevance_score: number;
}

export interface ToolCallRecord {
  tool_name: string;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown> | null;
  artifact_id: string | null;
}

// --- Documents ---

export type DocumentType =
  | "financial_statement"
  | "strategy_deck"
  | "meeting_transcript"
  | "board_deck"
  | "operating_plan"
  | "market_analysis"
  | "customer_data"
  | "website_content"
  | "other";

export interface SourceDocument {
  id: string;
  company_id: string;
  name: string;
  type: DocumentType;
  file_path: string | null;
  url: string | null;
  content_text: string | null;
  chunk_count: number;
  uploaded_by: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  company_id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding: number[] | null;
  metadata: ChunkMetadata;
  created_at: string;
}

export interface ChunkMetadata {
  document_name: string;
  document_type: DocumentType;
  page?: number;
  section?: string;
}

// --- Artifacts ---

export type ArtifactType =
  | "company_profile"
  | "value_creation_thesis"
  | "strategic_priorities"
  | "execution_plan"
  | "kpi_tree"
  | "risk_register"
  | "board_update"
  | "meeting_summary"
  | "action_item_list"
  | "specialist_recommendations"
  | "playbook_entry";

export interface Artifact {
  id: string;
  company_id: string;
  type: ArtifactType;
  title: string;
  content: ArtifactContent;
  version: number;
  created_by: string;
  source_message_id: string | null;
  created_at: string;
  updated_at: string;
}

// Discriminated union of artifact content shapes
export type ArtifactContent =
  | CompanyProfileContent
  | ValueCreationThesisContent
  | StrategicPrioritiesContent
  | ExecutionPlanContent
  | KpiTreeContent
  | RiskRegisterContent
  | BoardUpdateContent
  | MeetingSummaryContent
  | ActionItemListContent
  | SpecialistRecommendationsContent
  | PlaybookEntryContent;

export interface CompanyProfileContent {
  type: "company_profile";
  business_model: string;
  customer_segments: string[];
  revenue_streams: string[];
  key_products_services: string[];
  competitive_advantages: string[];
  key_metrics: Record<string, string>;
  growth_drivers: string[];
  key_risks: string[];
  management_team: TeamMember[];
  data_sources: string[];
  assumptions: string[];
  open_questions: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  notes?: string;
}

export interface ValueCreationThesisContent {
  type: "value_creation_thesis";
  headline: string;
  current_ev_drivers: string[];
  value_creation_levers: ValueCreationLever[];
  target_outcomes: string[];
  timeline: string;
  key_risks: string[];
  data_sources: string[];
  assumptions: string[];
}

export interface ValueCreationLever {
  lever: string;
  category: "revenue" | "margin" | "multiple" | "risk_reduction";
  impact: "high" | "medium" | "low";
  timeframe: "0-90d" | "90d-1y" | "1y+";
  owner: string;
  description: string;
}

export interface StrategicPrioritiesContent {
  type: "strategic_priorities";
  planning_horizon: string;
  level_1_goals: Goal[];
  level_2_goals: Goal[];
  assumptions: string[];
  open_questions: string[];
}

export interface Goal {
  id: string;
  level: 1 | 2;
  title: string;
  description: string;
  owner: string;
  success_metric: string;
  due_date: string | null;
  status: GoalStatus;
  parent_goal_id: string | null;
}

export type GoalStatus =
  | "not_started"
  | "on_track"
  | "at_risk"
  | "off_track"
  | "complete";

export interface ExecutionPlanContent {
  type: "execution_plan";
  period: string;
  objectives: string[];
  initiatives: Initiative[];
  milestones: Milestone[];
  resource_requirements: string[];
  risks: string[];
  assumptions: string[];
}

export interface Initiative {
  id: string;
  title: string;
  description: string;
  owner: string;
  start_date: string;
  end_date: string;
  status: GoalStatus;
  priority: "critical" | "high" | "medium" | "low";
  linked_goal_ids: string[];
  action_items: ActionItem[];
}

export interface Milestone {
  date: string;
  description: string;
  initiative_id: string;
}

export interface ActionItem {
  id: string;
  title: string;
  owner: string;
  due_date: string | null;
  status: "open" | "in_progress" | "done" | "blocked";
  priority: "high" | "medium" | "low";
  notes: string | null;
}

export interface KpiTreeContent {
  type: "kpi_tree";
  north_star_metric: KpiNode;
  driver_metrics: KpiNode[];
  assumptions: string[];
}

export interface KpiNode {
  id: string;
  name: string;
  definition: string;
  current_value: string | null;
  target_value: string | null;
  unit: string;
  cadence: "daily" | "weekly" | "monthly" | "quarterly";
  owner: string;
  children: string[];
}

export interface RiskRegisterContent {
  type: "risk_register";
  risks: Risk[];
  last_reviewed: string;
}

export interface Risk {
  id: string;
  category:
    | "strategic"
    | "financial"
    | "operational"
    | "market"
    | "talent"
    | "legal"
    | "technology";
  description: string;
  likelihood: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  owner: string;
  mitigation: string;
  status: "open" | "mitigating" | "closed";
  identified_date: string;
}

export interface BoardUpdateContent {
  type: "board_update";
  period: string;
  executive_summary: string;
  highlights: string[];
  lowlights: string[];
  key_metrics: Record<string, string>;
  decisions_needed: string[];
  strategic_updates: string[];
  financial_summary: string;
  next_90_days: string[];
  open_questions: string[];
}

export interface MeetingSummaryContent {
  type: "meeting_summary";
  meeting_date: string;
  attendees: string[];
  agenda_items: string[];
  key_decisions: string[];
  action_items: ActionItem[];
  open_issues: string[];
  next_meeting: string | null;
}

export interface ActionItemListContent {
  type: "action_item_list";
  items: ActionItem[];
  source_meeting: string | null;
}

export interface SpecialistRecommendationsContent {
  type: "specialist_recommendations";
  recommendations: SpecialistRecommendation[];
  context: string;
}

export interface SpecialistRecommendation {
  domain: string;
  rationale: string;
  urgency: "immediate" | "near_term" | "long_term";
  engagement_type: "advisory" | "fractional" | "project" | "full_time";
  key_criteria: string[];
}

export interface PlaybookEntryContent {
  type: "playbook_entry";
  category: string;
  title: string;
  situation: string;
  approach: string;
  outcome: string;
  learnings: string[];
  applicable_contexts: string[];
}

// --- Streaming ---

export type StreamEventType =
  | "text_delta"
  | "tool_start"
  | "tool_complete"
  | "mode_detected"
  | "sources"
  | "artifact_created"
  | "done"
  | "error";

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface TextDeltaEvent {
  type: "text_delta";
  data: { text: string };
}

export interface ArtifactCreatedEvent {
  type: "artifact_created";
  data: { artifact: Artifact };
}

export interface DoneEvent {
  type: "done";
  data: {
    message_id: string;
    mode: AgentMode;
    sources: SourceReference[];
    duration_ms: number;
  };
}

export interface ErrorEvent {
  type: "error";
  data: { message: string; code: string };
}

// --- API Request/Response shapes ---

export interface ChatRequest {
  company_id: string;
  conversation_id: string | null;
  message: string;
  mode?: AgentMode;
}

export interface UploadDocumentRequest {
  company_id: string;
  document_type: DocumentType;
  name: string;
  content_text?: string;
  url?: string;
}

export interface CreateArtifactRequest {
  company_id: string;
  type: ArtifactType;
  title: string;
  content: ArtifactContent;
  source_message_id?: string;
}

// --- Audit ---

export interface AuditLog {
  id: string;
  org_id: string;
  company_id: string | null;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}
