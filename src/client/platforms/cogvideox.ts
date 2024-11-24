"use client";
import {
    CogVideoX,
    REQUEST_TIMEOUT_MS, COGVIDEOX_BASE_URL,
} from "@/pages/chat/constant";
import {
    RunFlowRequestBody,
} from "@/store";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import {api} from "@/api/api.tsx";
import axios from "axios";

interface RequestBody {
    model: string;
    prompt: string;
    image_url?: string;
}

export class CogVideoXAPI implements LLMApi {
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
        const messageData = options.messages[options.messages.length - 1].content as string;
        let message: string = "";
        let messageimageUrl: string = "";

        if (Array.isArray(messageData)) {
            // 如果 messageData 是数组，假设第一个元素是文本，第二个元素是图片URL
            message = messageData[0].text;
            messageimageUrl = messageData[1].image_url?.url;
        } else {
            // 如果 messageData 不是数组，直接将其作为文本
            message = messageData as string;
        }
        let imageUrl: string = "";
        let videoUrl: string = "";

        const path = COGVIDEOX_BASE_URL
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
            const requestBody: RequestBody = {
                model: "cogvideox",
                prompt: message,
            };
            // 如果有图片URL，则添加到请求体中
            if (messageimageUrl) {
                requestBody.image_url = messageimageUrl;
            }
            const response = await axios.post(
                path,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-DashScope-Async': 'enable',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                })
            clearTimeout(requestTimeoutId);
            const taskId = response.data.id;
            const checkPath = CogVideoX.runPath(taskId);
            setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            let checkResponse = await axios.get(checkPath, {
                headers: {'Authorization': `Bearer ${apiKey}`,},
            })
            clearTimeout(requestTimeoutId);
            setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
            while (checkResponse.data.task_status !== "SUCCESS") {
                console.log("checkResponse", checkResponse.data.task_status);
                if (checkResponse.data.task_status === "FAIL") {
                    throw new Error(checkResponse.data);
                }
                await new Promise((resolve) => setTimeout(resolve, 8000));
                checkResponse = await axios.get(checkPath, {
                    headers: {'Authorization': `Bearer ${apiKey}`,},
                });
            }
            imageUrl = checkResponse.data.video_result[0].cover_image_url;
            videoUrl = checkResponse.data.video_result[0].url;
            options.onFinish(
                `![Alt image](${imageUrl})\n` +
                '<a>' +
                '<video width="320" height="240" controls>' +
                `<source src="${videoUrl}" type="video/mp4">` +
                '</video>'
                + '</a>'
            );
        } catch (e) {
            ``
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

export {CogVideoX};
