"use client";
import {
    WangX,
    REQUEST_TIMEOUT_MS, WANGX_BASE_URL,
} from "@/pages/chat/constant";
import {
    RunFlowRequestBody,
} from "@/store";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import {api} from "@/api/api.tsx";
import axios from "axios";


export class WangXApi implements LLMApi {
    async initSession(url: string, payload: RunFlowRequestBody) {
        try {
            const response = await api.post(url, payload);
            return response.data
        } catch (error) {
            console.error("Request Error:", error);
            throw error;
        }
    }

    async chat(options: ChatOptions) {
        const message = options.messages[options.messages.length - 1].content as string;

        let imageUrl: string = "";

        const path = WANGX_BASE_URL
        const controller = new AbortController();
        options.onController?.(controller);
        controller.signal.onabort = () => {
            throw new Error("Request Timeout");
        }
        const apiKey = options.config.components[0].tweaks[0].value as string;
        try {
            // make a fetch request
            const requestTimeoutId = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS,
            );
            const response = await axios.post(
                path,
                {
                    model: "wanx-v1",
                    input: {prompt: message,},
                    parameters: {
                        style: "<auto>",
                        size: "1024*1024",
                        n: 1
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-DashScope-Async': 'enable',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    signal: controller.signal,
                })
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
            imageUrl = checkResponse.data.output.results[0].url;
            options.onFinish(`![Alt image](${imageUrl})`);
        } catch (e) {
            console.log(e)
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

export {WangX};
