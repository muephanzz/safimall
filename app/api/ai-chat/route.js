// app/api/ai-chat/route.js
import { NextResponse } from "next/server";

export const runtime = 'nodejs'; // Add this

export async function POST(request) {
  try {
    // Validate API key first
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const { messages } = await request.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages format" }, 
        { status: 400 }
      );
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

    // Handle OpenAI API errors
    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 429) {
        throw new Error("OpenAI API rate limit exceeded. Please try again later.");
      }
      if (response.status === 403) {
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      }
      throw new Error(`OpenAI API error: ${errorData.error?.message}`);
    }    

    const data = await response.json();

    if (data.choices?.[0]?.message?.content) {
      return NextResponse.json({ 
        text: data.choices[0].message.content.trim() 
      });
    }

    return NextResponse.json(
      { error: "No response from AI" }, 
      { status: 500 }
    );

  } catch (error) {
    console.error("AI Chat Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
