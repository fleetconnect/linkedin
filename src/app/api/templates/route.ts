import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.template.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const template = await prisma.template.create({
    data: {
      name: body.name,
      subject: body.subject,
      body: body.body,
      tags: body.tags,
    },
  });
  return NextResponse.json(template, { status: 201 });
}
