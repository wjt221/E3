/**
 * AI Agent Mode Detection Tests
 *
 * Verifies that the mode detection logic correctly identifies the appropriate
 * operating mode from natural language input. This ensures the AI Operating
 * Partner responds in the right context.
 */

import { describe, it, expect } from "@jest/globals";
import { detectMode, buildSystemPrompt, buildCompanyContextString } from "../lib/ai/prompts";
import type { AgentMode } from "../types";

describe("Mode detection", () => {
  describe("learn mode", () => {
    const learnPhrases = [
      "Here is our website: https://example.com",
      "Here is our strategy deck",
      "Let me share our financials",
      "This is our company",
      "Here's our business model",
    ];

    for (const phrase of learnPhrases) {
      it(`detects learn from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("learn");
      });
    }
  });

  describe("diagnose mode", () => {
    const diagnosePhrases = [
      "Where are we off track?",
      "What are our biggest risks?",
      "We're struggling with sales",
      "What's holding us back?",
      "What should I be worried about?",
    ];

    for (const phrase of diagnosePhrases) {
      it(`detects diagnose from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("diagnose");
      });
    }
  });

  describe("plan mode", () => {
    const planPhrases = [
      "What should we focus on this quarter?",
      "Build a plan for the next 90 days",
      "Turn this into an execution plan",
      "What are our Level 1 goals?",
      "Our priorities for next year",
    ];

    for (const phrase of planPhrases) {
      it(`detects plan from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("plan");
      });
    }
  });

  describe("cadence mode", () => {
    const cadencePhrases = [
      "Here is the transcript from our leadership meeting",
      "Weekly update from the team",
      "Meeting notes from Monday",
      "Status update for this week",
    ];

    for (const phrase of cadencePhrases) {
      it(`detects cadence from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("cadence");
      });
    }
  });

  describe("board_prep mode", () => {
    const boardPhrases = [
      "Help me prepare for my board meeting",
      "Board update for Q2",
      "Investor update",
      "Prepare board deck",
      "Board prep for Thursday",
    ];

    for (const phrase of boardPhrases) {
      it(`detects board_prep from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("board_prep");
      });
    }
  });

  describe("specialists mode", () => {
    const specialistPhrases = [
      "Who should help us with our go-to-market?",
      "We need help with our finance function",
      "Should we hire a CFO or use a fractional?",
      "Recommend specialists for our technology stack",
    ];

    for (const phrase of specialistPhrases) {
      it(`detects specialists from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("specialists");
      });
    }
  });

  describe("playbook mode", () => {
    const playbookPhrases = [
      "Add this to the playbook",
      "What we learned from the pricing experiment",
      "Lesson learned from the Q3 miss",
      "We should remember this for next time",
    ];

    for (const phrase of playbookPhrases) {
      it(`detects playbook from: "${phrase}"`, () => {
        const mode = detectMode(phrase, "learn");
        expect(mode).toBe("playbook");
      });
    }
  });

  describe("mode persistence", () => {
    it("maintains current mode when no strong signal", () => {
      const currentMode: AgentMode = "plan";
      const ambiguousMessage = "Can you help me with this?";
      expect(detectMode(ambiguousMessage, currentMode)).toBe("plan");
    });

    it("overrides current mode when strong signal found", () => {
      const currentMode: AgentMode = "plan";
      const boardMessage = "Prepare me for my board meeting";
      expect(detectMode(boardMessage, currentMode)).toBe("board_prep");
    });
  });
});

// =============================================================================
// SYSTEM PROMPT SECURITY
// =============================================================================

describe("System prompt security", () => {
  it("always includes data scope restriction", () => {
    const prompt = buildSystemPrompt("learn", "Test Company", "Some context");
    expect(prompt).toContain("may ONLY use data from the company context");
    expect(prompt).toContain("may NEVER reference");
  });

  it("includes fact/assumption/recommendation distinction", () => {
    const prompt = buildSystemPrompt("diagnose", "Test Company", "");
    expect(prompt).toContain("FACT");
    expect(prompt).toContain("ASSUMPTION");
    expect(prompt).toContain("RECOMMENDATION");
  });

  it("includes the correct mode instructions", () => {
    const learnPrompt = buildSystemPrompt("learn", "Company", "");
    const boardPrompt = buildSystemPrompt("board_prep", "Company", "");

    expect(learnPrompt).toContain("LEARN THE BUSINESS MODE");
    expect(boardPrompt).toContain("PREPARE THE BOARD MODE");
  });

  it("includes value creation framing", () => {
    const prompt = buildSystemPrompt("plan", "Company", "");
    expect(prompt).toContain("enterprise value creation");
  });
});

// =============================================================================
// COMPANY CONTEXT BUILDING
// =============================================================================

describe("Company context building", () => {
  it("handles null company gracefully", () => {
    const context = buildCompanyContextString(null, null);
    expect(context).toContain("No company context available");
  });

  it("includes company name in context", () => {
    const context = buildCompanyContextString(
      {
        name: "Acme Corp",
        industry: "SaaS",
        stage: "growth",
        description: null,
        employee_count: 50,
        revenue_range: "$5M-$10M",
      },
      null
    );

    expect(context).toContain("Acme Corp");
    expect(context).toContain("SaaS");
    expect(context).toContain("growth");
    expect(context).toContain("50");
  });

  it("includes latest profile if available", () => {
    const context = buildCompanyContextString(
      {
        name: "Acme Corp",
        industry: null,
        stage: null,
        description: null,
        employee_count: null,
        revenue_range: null,
      },
      {
        version: 2,
        content: {
          type: "company_profile",
          business_model: "B2B SaaS subscription",
          customer_segments: ["Mid-market", "Enterprise"],
          revenue_streams: ["Subscription", "Professional services"],
        },
      } as import("../types").Artifact
    );

    expect(context).toContain("B2B SaaS subscription");
    expect(context).toContain("Mid-market");
    expect(context).toContain("v2");
  });
});
