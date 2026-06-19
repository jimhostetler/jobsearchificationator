import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncCompanies } from "@/lib/claudemd";
import { CompanyStatus } from "@prisma/client";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, status, why, notes } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        status: (status as CompanyStatus) ?? "watch",
        why: why?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    await syncCompanies();

    return NextResponse.json(company, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Company already exists" }, { status: 409 });
    }
    console.error("Error creating company:", error);
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
  }
}
