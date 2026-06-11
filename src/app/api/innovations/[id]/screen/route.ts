import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runLLMScreening } from "@/lib/deepseek";
import { normaliseScores } from "@/lib/scoring";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const innovation = await prisma.innovation.findUnique({
      where: { id },
      include: {
        primaryBlock: { select: { code: true, name: true } },
        classifications: { select: { blockId: true } },
      },
    });
    if (!innovation || !innovation.primaryBlock) {
      return NextResponse.json({ error: "Innovation or primary block not found" }, { status: 404 });
    }

    const blockId = innovation.primaryBlockId!;
    const mapping = await prisma.blockFrameworkMapping.findFirst({
      where: { blockId },
      include: { framework: { include: { criteria: true } } },
    });
    if (!mapping) {
      return NextResponse.json({ error: "No active framework for this block" }, { status: 400 });
    }

    const framework = mapping.framework;
    const innovationData = {
      code: innovation.code,
      title: innovation.title,
      executiveSummary: innovation.executiveSummary,
      painPoints: innovation.painPoints,
      detailedSolution: innovation.detailedSolution,
      primaryBlockName: innovation.primaryBlock.name,
      isBankWide: innovation.isBankWide,
    };
    const frameworkData = {
      name: framework.name,
      formula: framework.formula,
      criteria: framework.criteria.map((c) => ({
        name: c.name,
        description: c.description,
        weight: c.weight,
        minScore: c.minScore,
        maxScore: c.maxScore,
      })),
    };

    const result = await runLLMScreening(innovationData, frameworkData, DEEPSEEK_API_KEY);
    const finalScore = normaliseScores(result.criteria_scores, framework.name);

    const screening = await prisma.innovationScreening.create({
      data: {
        innovationId: id,
        frameworkId: framework.id,
        normalisedScore: finalScore,
        rawResponse: JSON.stringify(result),
        scores: {
          create: result.criteria_scores.map((cs) => {
            const criterion = framework.criteria.find((c) => c.name === cs.criterion);
            return {
              criterionId: criterion?.id || "",
              score: cs.score,
              reasoning: cs.reasoning,
            };
          }),
        },
      },
      include: { scores: { include: { criterion: true } } },
    });

    await prisma.innovation.update({
      where: { id },
      data: { status: "SCREENED" },
    });

    await prisma.innovationLog.create({
      data: { innovationId: id, action: "SCREENING_COMPLETED", payload: JSON.stringify({ score: finalScore }) },
    });

    return NextResponse.json({ screening, finalScore });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
