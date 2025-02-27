import { NextRequest, NextResponse } from "next/server";
import { load } from "@tauri-apps/plugin-store";


export async function GET(request: NextRequest) {
  try {
    // Get the token from the search params
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Store the token in the Tauri store
    const store = await load("store.json", { autoSave: true });
    await store.set("token", token);
    await store.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing token:", error);
    return NextResponse.json(
      { error: "Failed to store token" },
      { status: 500 }
    );
  }
}
