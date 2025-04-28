import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    // Process the callback data here (e.g., save to DB)

    // Log or handle the callback details as needed
    console.log("Received STK callback:", body);

    // Respond with HTTP 200 and a success message
    return NextResponse.json("ok", { status: 200 });
  } catch (error) {
    console.error("Callback processing error:", error);
    // Still respond with 200 to avoid retries, or 500 if you want retries
    return NextResponse.json("ok", { status: 200 });
  }
}
