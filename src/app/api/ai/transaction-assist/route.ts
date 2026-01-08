import { NextResponse } from "next/server";
import { suggestTransactionFromText } from "@/ai/flows/transaction-quickfill";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, categories } = body ?? {};

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Request body must include 'text' as a string." },
        { status: 400 }
      );
    }

    const sanitizedCategories = Array.isArray(categories)
      ? categories.filter((c: unknown) => typeof c === "string")
      : undefined;

    const suggestion = await suggestTransactionFromText({
      text,
      categories: sanitizedCategories,
    });

    return NextResponse.json(suggestion, { status: 200 });
  } catch (error) {
    console.error("AI transaction assist failed", error);
    return NextResponse.json(
      { error: "Unable to generate AI-assisted transaction." },
      { status: 500 }
    );
  }
}
