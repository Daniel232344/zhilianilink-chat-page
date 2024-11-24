"use client";
import {
    RunFlowRequestBody,
} from "@/store";
import {ChatOptions, LLMApi, LLMModel} from "../api";
import {api} from "@/api/api.tsx";
import axios from "axios";
import {REQUEST_TIMEOUT_MS, WENXIN_OAUTH_URL, WENXIN_TASK_URL} from "@/pages/chat/constant.ts";


export class WenxinApi implements LLMApi {
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

        const controller = new AbortController();
        options.onController?.(controller);
        controller.signal.onabort = () => {
            throw new Error("Request Timeout");
        }
        const Ak = options.config.components[0].tweaks[0].value as string;
        const Sk = options.config.components[0].tweaks[1].value as string;

        try {
            // setEnvVariable('QIANFAN_ACCESS_KEY', Ak);
            // setEnvVariable('QIANFAN_SECRET_KEY', Sk);

            // 获取访问令牌
            const params = {
                grant_type: 'client_credentials',
                client_id: Ak,
                client_secret: Sk,
            };

            const tokenResponse = await axios.post(WENXIN_OAUTH_URL, null, {params});
            const accessToken = tokenResponse.data.access_token;

            // 使用 access_token 调用 text2Image API
            const apiUrl = WENXIN_TASK_URL + 'sd_xl?access_token=' + accessToken;

            const resp = await axios.post(apiUrl, {
                prompt: message,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            const base64Image = "data:image/png;base64," + resp.data.data[0].b64_image;
            options.onFinish(`![Alt image](${base64Image})`);
            // 处理成功的响应
            // options.onFinish(`![Alt image](data:image/png;base64,${base64Image})`);
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
