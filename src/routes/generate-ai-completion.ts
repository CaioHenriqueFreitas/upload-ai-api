import { FastifyInstance } from "fastify";
import { createReadStream } from "node:fs"
import { prisma } from "../lib/prisma";
import { z } from 'zod';
import { openai } from "./openai";

export async function generateAICompletionRoute(app: FastifyInstance) {
    app.post('/ai/complete', async (request, response) => {

        const bodySchema = z.object({
            videoId: z.string().uuid(),
            template: z.string(),
            temperature: z.number().min(0).max(1).default(0.5),
        })

        const { videoId, template, temperature } = bodySchema.parse(request.body)

        const video = await prisma.video.findUniqueOrThrow({
            where: {
                id: videoId,
            }
        })

        if (!video.transcript) {
            return response.status(400).send({ error: "Transcription was not generated yet." })
        }

        const promptMessage = template.replace('{transcription}', video.transcript)

        const openaiResponse = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature,
            messages: [{
                role: 'user',
                content: promptMessage
            }],
        })

        return {
            openaiResponse
        }

    })
}