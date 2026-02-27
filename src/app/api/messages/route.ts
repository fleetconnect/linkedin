import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = await prisma.message.create({
    data: {
      body: body.body,
      contactId: body.contactId,
      templateId: body.templateId ?? null,
      sentAt: body.sentAt ? new Date(body.sentAt) : null,
    },
  });
  // Advance contact status if it's "not_contacted"
  const contact = await prisma.contact.findUnique({ where: { id: body.contactId } });
  if (contact?.status === "not_contacted") {
    await prisma.contact.update({
      where: { id: body.contactId },
      data: { status: "sent" },
    });
  }
  return NextResponse.json(message, { status: 201 });
}
