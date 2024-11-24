"use client";
import {
    Langflow, QWEN_VL_BASE_URL,
    REQUEST_TIMEOUT_MS,
} from "@/pages/chat/constant";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import Locale from "../../locales";
import {
    EventStreamContentType,
    fetchEventSource,
} from "@fortaine/fetch-event-source";
import {prettyObject} from "@/utils/format";
import axios from "axios";


export class QWenVLApi implements LLMApi {
    async chat(options: ChatOptions) {
        const messages = options.messages.map((v) => {
            if (typeof v.content == "string") {
                return {
                    role: v.role,
                    content: [{text: v.content.trim()}]
                }
            } else {
                return {
                    role: v.role,
                    content: v.content.map((m) => {
                        if (m.type == "text") {
                            return {text: m.text}
                        } else {
                            return {image: m.image_url.url}
                        }
                    })
                }
            }
        });
        const shouldStream = !!options.config.stream;
        const path = QWEN_VL_BASE_URL
        const controller = new AbortController();
        options.onController?.(controller);
        try {
            const chatPayload = {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${options.config.components[0].tweaks[0].value}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "qwen-vl-chat-v1",
                    input: {messages: messages},
                    parameters: {}
                }),
                signal: controller.signal,
            };
            // make a fetch request
            const requestTimeoutId = setTimeout(
                () => controller.abort(),
                REQUEST_TIMEOUT_MS,
            );
            if (shouldStream) {
                chatPayload.headers['X-DashScope-SSE'] = 'enable'
                let responseText = "";
                let remainText = "";
                let finished = false;

                // animate response to make it looks smooth
                function animateResponseText() {
                    if (finished || controller.signal.aborted) {
                        responseText += remainText;
                        console.log("[Response Animation] finished");
                        if (responseText?.length === 0) {
                            options.onError?.(new Error("empty response from server"));
                        }
                        return;
                    }

                    if (remainText.length > 0) {
                        const fetchCount = Math.max(1, Math.round(remainText.length / 60));
                        const fetchText = remainText.slice(0, fetchCount);
                        responseText += fetchText;
                        remainText = remainText.slice(fetchCount);
                        options.onUpdate?.(responseText, fetchText);
                    }

                    requestAnimationFrame(animateResponseText);
                }

                // start animaion
                animateResponseText();

                const finish = () => {
                    if (!finished) {
                        finished = true;
                        options.onFinish(responseText + remainText);
                    }
                };

                controller.signal.onabort = finish;

                fetchEventSource(path, {
                    ...chatPayload,
                    async onopen(res) {
                        clearTimeout(requestTimeoutId);
                        const contentType = res.headers.get("content-type");
                        if (contentType?.startsWith("text/plain")) {
                            responseText = await res.clone().text();
                            return finish();
                        }
                        if (
                            !res.ok ||
                            !res.headers
                                .get("content-type")
                                ?.startsWith(EventStreamContentType) ||
                            res.status !== 200
                        ) {
                            const responseTexts = [responseText];
                            let extraInfo = await res.clone().text();
                            try {
                                const resJson = await res.clone().json();
                                extraInfo = prettyObject(resJson);
                            } catch {
                            }

                            if (res.status === 401) {
                                responseTexts.push(Locale.Error.Unauthorized);
                            }

                            if (extraInfo) {
                                responseTexts.push(extraInfo);
                            }

                            responseText = responseTexts.join("\n\n");

                            return finish();
                        }
                    },
                    onmessage(msg) {
                        if (msg.event === "close" || finished) {
                            return finish();
                        }
                        const text = msg.data;
                        try {
                            const json = JSON.parse(text);
                            const chunk = json?.output.choices[0].message.content as string;
                            if (chunk) {
                                remainText = chunk.slice(responseText.length);
                            }
                        } catch (e) {
                            console.error("[Request] parse error", text, msg);
                        }
                    },
                    onclose() {
                        finish();
                    },
                    onerror(e) {
                        options.onError?.(e);
                        throw e;
                    },
                    openWhenHidden: true,
                });
            } else {
                const res = await axios(chatPayload)
                options.onFinish(res.data.output.choices.message.content);
            }
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
