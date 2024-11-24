"use client";
import {ApiPath, Langflow, REQUEST_TIMEOUT_MS,} from "@/pages/chat/constant";
import {getRunFlowRequestBody, RunFlowRequestBody, useAccessStore,} from "@/store";

import {ChatOptions, LLMApi, LLMModel} from "../api";
import Locale from "../../locales";
import {EventStreamContentType, fetchEventSource,} from "@fortaine/fetch-event-source";
import {prettyObject} from "@/utils/format";
import {api} from "@/api/api.tsx";
import axios from "axios";


export class LangflowApi implements LLMApi {
  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = ApiPath.Langflow as string;

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }

    return [baseUrl, path].join("/");
  }
  async initSession(url: string, payload: RunFlowRequestBody) {
    try {
      return await axios.post(url, payload)
    } catch (error) {
      console.error("Request Error:", error);
      throw error;
    }
  }
  async chat(options: ChatOptions) {
    let message = "以下是我们的对话: \n\n";
    options.messages.forEach((v) => {
      message += `${v.role}:\n${(v.content as string).trim()}\n\n`;
    });
    message += "现在该你回复了: \n\n";
    const model = options.config.model;

    const shouldStream = !!options.config.stream;
    const requestPayload = getRunFlowRequestBody(
      message,
      shouldStream,
      options.config.components || [],
    );
    let chatPath = this.path(Langflow.ChatPath(model));
    let initResponse = null;
    try {
      initResponse = await this.initSession(chatPath, requestPayload);
      initResponse = initResponse.data;
    } catch (e) {
      options.onError?.(e as Error);
      throw e;
    }
    const controller = new AbortController();
    options.onController?.(controller);

    try {
      const chatPayload = {
        method: "GET",
        signal: controller.signal,
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      if (
        shouldStream &&
        initResponse &&
        initResponse.outputs &&
        initResponse.outputs[0].outputs[0].artifacts.stream_url
      ) {
        const streamUrl = this.path(initResponse.outputs[0].outputs[0].artifacts.stream_url);
        let responseText = "";
        let remainText = "";
        let finished = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
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

        fetchEventSource(streamUrl, {
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
              } catch {}

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
              const chunk = json?.chunk;
              if (chunk) {
                remainText += chunk;
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
        const flowOutputs = initResponse.outputs[0];
        const firstComponentOutputs = flowOutputs.outputs[0];
        const output = firstComponentOutputs.outputs.message;
        options.onFinish(output.message.text);
      }
    } catch (e) {
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
export { Langflow };
