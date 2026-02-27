import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const contacts = await prisma.contact.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { company: { contains: search } },
              { role: { contains: search } },
            ],
          }
        : {}),
    },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      company: body.company,
      role: body.role,
      linkedinUrl: body.linkedinUrl,
      email: body.email,
      notes: body.notes,
      status: body.status ?? "not_contacted",
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
