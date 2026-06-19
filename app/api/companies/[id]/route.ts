import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncCompanies } from "@/lib/claudemd";
import { CompanyStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Pull jobs and candidates by company name match
    const [jobs, candidates] = await Promise.all([
      prisma.job.findMany({
        where: { company: company.name },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, matchScore: true, createdAt: true },
      }),
      prisma.candidate.findMany({
        where: { company: company.name },
        orderBy: { discoveredAt: "desc" },
        select: { id: true, title: true, status: true, matchScore: true, discoveredAt: true },
      }),
    ]);

    return NextResponse.json({ ...company, jobs, candidates });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ error: "Failed to fetch company" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { status, why, notes, name } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status as CompanyStatus;
    if (why !== undefined) data.why = why?.trim() || null;
    if (notes !== undefined) data.notes = notes?.trim() || null;
    if (name !== undefined) data.name = name.trim();

    const company = await prisma.company.update({ where: { id }, data });

    await syncCompanies();

    return NextResponse.json(company);
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "Company name already exists" }, { status: 409 });
    }
    console.error("Error updating company:", error);
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    await prisma.company.delete({ where: { id } });
    await syncCompanies();
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Error deleting company:", error);
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 });
  }
}
