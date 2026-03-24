import { Agent, type AgentMessage, type AgentTool } from "@mariozechner/pi-agent-core";
import type { Static, TSchema, ThinkingLevel } from "@mariozechner/pi-ai";

import type { AnyModel } from "../types.js";

interface StructuredToolAgentOptions<TParameters extends TSchema> {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  systemPrompt: string;
  userPrompt: string;
  tool: Omit<AgentTool<TParameters>, "execute">;
}

function readAssistantText(messages: AgentMessage[]): string {
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  if (!lastAssistantMessage || !Array.isArray(lastAssistantMessage.content)) {
    return "";
  }

  return lastAssistantMessage.content
    .filter((block): block is Extract<(typeof lastAssistantMessage.content)[number], { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

export async function runStructuredToolAgent<TParameters extends TSchema>(
  options: StructuredToolAgentOptions<TParameters>,
): Promise<Static<TParameters>> {
  let captured: Static<TParameters> | undefined;

  const tool: AgentTool<TParameters> = {
    ...options.tool,
    execute: async (_toolCallId, params) => {
      captured = params;

      return {
        content: [{ type: "text", text: `${options.tool.name} saved.` }],
        details: {},
      };
    },
  };

  const agent = new Agent({
    initialState: {
      systemPrompt: options.systemPrompt,
      model: options.model,
      thinkingLevel: options.thinkingLevel,
      tools: [tool],
      messages: [],
    },
  });

  await agent.prompt(options.userPrompt);

  if (captured) {
    return captured;
  }

  await agent.prompt(
    `You must call \`${tool.name}\` exactly once now. Do not answer with prose. Use the full tool schema.`,
  );

  if (captured) {
    return captured;
  }

  const assistantText = readAssistantText(agent.state.messages);
  const suffix = assistantText ? ` Last assistant reply: ${assistantText}` : "";
  throw new Error(`The model did not call the required tool "${tool.name}".${suffix}`);
}
