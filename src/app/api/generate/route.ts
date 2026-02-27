import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { contact, template, tone, goal } = body;

  if (!contact?.name) {
    return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
  }

  const systemPrompt = `You are an expert LinkedIn outreach specialist. Generate personalized, professional LinkedIn messages that feel genuine and human. Keep messages concise (under 300 characters for connection requests, under 1000 for InMails). Never use generic platitudes.`;

  const userPrompt = `Generate a LinkedIn outreach message for the following person:

Name: ${contact.name}
${contact.company ? `Company: ${contact.company}` : ""}
${contact.role ? `Role: ${contact.role}` : ""}
${contact.notes ? `Additional context: ${contact.notes}` : ""}

${template ? `Base template to personalize:\n${template.body}` : ""}

Tone: ${tone ?? "professional and friendly"}
Goal: ${goal ?? "establish a connection and explore potential collaboration"}

Return ONLY the message text, no additional commentary.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ message: text });
}
