import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `you are an AI-powered customer support assistant for a small business that helps navigate people to their destination with the least amount of turns in the least amount of time`

export async function POST(req) {
    try {
        const openai = new OpenAI();
        const data = await req.json();

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                ...data,
            ],
            model: 'gpt-4o-mini', 
            stream: true,
        });

        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of completion) {
                        const content = chunk.choices[0]?.delta?.content;
                        if (content) {
                            const text = encoder.encode(content);
                            controller.enqueue(text);
                        }
                    }
                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new NextResponse(stream);

    } catch (error) {
        console.error('Error processing the request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
