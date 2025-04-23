// app/api/ai-chat/route.js
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices[0]) {
      return NextResponse.json({ text: data.choices[0].message.content.trim() });
    }

    return NextResponse.json({ error: "No response from AI" }, { status: 500 });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
