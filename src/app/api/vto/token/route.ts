import { createDecartClient } from "@decartai/sdk";
import { NextResponse } from "next/server";

function getServerClient() {
  return createDecartClient({
    apiKey: process.env.DECART_API_KEY!,
  });
}

export async function POST() {
  try {
    const serverClient = getServerClient();
    const token = await serverClient.tokens.create();
    return NextResponse.json(token);
  } catch (error) {
    console.error("Token creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create session token" },
      { status: 500 },
    );
  }
}
