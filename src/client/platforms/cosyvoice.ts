"use client";
import {
    COSY_VOICE_BASE_URL,
    Langflow,
    REQUEST_TIMEOUT_MS,
} from "@/pages/chat/constant";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import {api} from "@/api/api.tsx";


export class CosyVoice implements LLMApi {
    async chat(options: ChatOptions) {
        const message = options.messages[options.messages.length - 1];
        const path = COSY_VOICE_BASE_URL
        const controller = new AbortController();
        options.onController?.(controller);
        const apiKey = options.config.components[0].tweaks[0].value as string;
        try {
            const requestTimeoutId = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS,
            );
            // make a fetch request
            const response = await api.post(path, {
                apiKey: apiKey,
                prompt: message.content,
            }, {
                signal: controller.signal,
            });
            clearTimeout(requestTimeoutId);
            options.onFinish(`<audio controls src="${response.data.data}"></audio>`);
        } catch (e) {
            console.log("[Request] failed to make a chat request", e);
            options.onError?.(e as Error);
        }
    }

    async usage() {
        return {
            used: 0,
            total: 0,
        };
    }

    async models(): Promise<LLMModel[]> {
        return [];
    }
}

export {Langflow};
