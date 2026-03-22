import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

type MessageType = "email" | "linkedin";

interface GenerateRequest {
  type: MessageType;
  notes: string;
  lead: {
    companyName: string;
    contactPerson: string;
    status: string;
  };
}

const SYSTEM_PROMPT = `You are an expert business development writer at a logistics and freight forwarding company called Snapes.

Your job is to craft highly personalized, professional outreach messages for sales representatives. Every message you write must:

1. Reference specific details from the sales rep's notes to show genuine understanding of the prospect's needs.
2. Be grounded in the logistics and freight forwarding industry — mention relevant services such as ocean freight, air freight, customs brokerage, warehousing, supply chain visibility, last-mile delivery, or cross-border compliance as appropriate.
3. Maintain a warm, consultative tone — never pushy or generic. Position Snapes as a knowledgeable partner, not just a vendor.
4. Include a clear, low-friction call to action (e.g. a short call, a quick chat, sharing a relevant case study).
5. Be concise and scannable — busy logistics professionals don't read walls of text.

Do NOT include subject lines unless the format is email. Do NOT add placeholder brackets like [Your Name] — write the message as ready to send.`;

function buildUserPrompt(req: GenerateRequest): string {
  const formatLabel = req.type === "email" ? "Email" : "LinkedIn Message";

  return `Generate a professional ${formatLabel} for outreach to the following lead.

**Company:** ${req.lead.companyName}
**Contact Person:** ${req.lead.contactPerson}
**Lead Status:** ${req.lead.status}

**Sales Rep's Notes:**
${req.notes}

Write the ${formatLabel.toLowerCase()} now. ${
    req.type === "email"
      ? "Include a compelling subject line on the first line prefixed with 'Subject: '."
      : "Keep it under 300 characters to fit LinkedIn's message constraints. Be direct and personable."
  }`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as GenerateRequest;

  if (!body.notes?.trim()) {
    return Response.json(
      { error: "Notes are required to generate a message." },
      { status: 400 },
    );
  }

  if (!body.type || !["email", "linkedin"].includes(body.type)) {
    return Response.json(
      { error: 'Invalid type. Must be "email" or "linkedin".' },
      { status: 400 },
    );
  }

  if (!body.lead?.companyName || !body.lead?.contactPerson) {
    return Response.json(
      { error: "Lead company name and contact person are required." },
      { status: 400 },
    );
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(body) }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    const generatedText = textBlock?.text ?? "";

    return Response.json({ message: generatedText });
  } catch (err) {
    console.error("AI generation failed:", err);
    return Response.json(
      { error: "Failed to generate message. Please try again." },
      { status: 500 },
    );
  }
}
