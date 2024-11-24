"use client";
import {
    Langflow, QWEN_DOODLE_BASE_URL,
    REQUEST_TIMEOUT_MS, WangX,
} from "@/pages/chat/constant";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import axios from "axios";


export class QwenDoodle implements LLMApi {
    async chat(options: ChatOptions) {
        const message = options.messages[options.messages.length - 1];
        if (typeof message.content == "string") {
            options.onError?.(new Error("QwenDoodle require image input"));
            return
        }

        const path = QWEN_DOODLE_BASE_URL
        const controller = new AbortController();
        options.onController?.(controller);
        const apiKey = options.config.components[0].tweaks[0].value as string;
        try {
            const requestTimeoutId = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS,
            );
            // make a fetch request
            const response = await axios.post(path, {
                model: "wanx-sketch-to-image-lite",
                input: {
                    "sketch_image_url": message.content[1].image_url.url,
                    "prompt": message.content[0].text
                },
                parameters: {
                    "size": "768*768",
                    "n": 1,
                    "style": "<flat illustration>",
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable',
                },
                signal: controller.signal,
            });
            clearTimeout(requestTimeoutId);
            const taskId = response.data.output.task_id;
            const checkPath = WangX.runPath(taskId);
            setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            let checkResponse = await axios.get(checkPath, {
                headers: {'Authorization': `Bearer ${apiKey}`,},
                signal: controller.signal,
            })
            clearTimeout(requestTimeoutId);
            setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            while (checkResponse.data.output.task_status !== "SUCCEEDED") {
                if (checkResponse.data.output.task_status === "FAILED") {
                    throw new Error(checkResponse.data.output.message);
                }
                await new Promise((resolve) => setTimeout(resolve, 8000));
                checkResponse = await axios.get(checkPath, {
                    headers: {'Authorization': `Bearer ${apiKey}`,},
                    signal: controller.signal,
                });
            }
            const imageUrl = checkResponse.data.output.results[0].url;
            options.onFinish(`![Alt image](${imageUrl})`);
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
