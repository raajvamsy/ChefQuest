import { NextResponse } from "next/server";
import { aiRouter } from "@/lib/ai-router";

export async function POST(request: Request) {
  try {
    const { originalStep, validationResult, remainingSteps } = await request.json();

    if (!originalStep || !validationResult || !Array.isArray(remainingSteps)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const adjustment = await aiRouter.suggestTaskAdjustments(
      originalStep,
      validationResult,
      remainingSteps
    );

    return NextResponse.json({ adjustment });
  } catch (error) {
    return NextResponse.json(
      {
        error: String(error),
        message: "Failed to generate task adjustments",
      },
      { status: 500 }
    );
  }
}

