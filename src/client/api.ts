import {ACCESS_CODE_PREFIX, ModelProvider, ServiceProvider,} from "@/pages/chat/constant";
import {ChatMessage, Component, ModelType, useAccessStore, useChatStore,} from "@/store";
import {LangflowApi} from "@/client/platforms/langflow";
import {WangXApi} from "@/client/platforms/wanx.ts";
import {QWenVLApi} from "@/client/platforms/qwenvl.ts";
import {WenxinApi} from "@/client/platforms/wenxin.ts";
import {CogViewApi} from "@/client/platforms/cogview.ts";
import {CogVideoXAPI} from "@/client/platforms/cogvideox.ts";
import {FuyuApi} from "@/client/platforms/fuyu.ts";
import {QwenDoodle} from "@/client/platforms/qwendoodle.ts";
import {CosyVoice} from "@/client/platforms/cosyvoice.ts";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

export interface MultimodalContent {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
    image_encoded?: {
        code: string;
    };
}

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  providerName?: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
  components?: Component[];
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;

  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  displayName?: string;
  available: boolean;
  provider: LLMModelProvider;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
}

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.Langflow) {
    switch (provider) {
      case ModelProvider.Langflow:
        this.llm = new LangflowApi();
        break;
      case ModelProvider.WangX:
        this.llm = new WangXApi();
        break;
      case ModelProvider.QWenVL:
        this.llm = new QWenVLApi();
        break;
      case ModelProvider.CogView:
        this.llm = new CogViewApi();
        break;
      case ModelProvider.CogVideoX:
        this.llm = new CogVideoXAPI();
        break;
      case ModelProvider.WenXin:
        this.llm = new WenxinApi();
        break;
      case ModelProvider.FuYu:
        this.llm = new FuyuApi();
        break;
      case ModelProvider.QWenDoodle:
        this.llm = new QwenDoodle();
        break;
      case ModelProvider.CosyVoice:
        this.llm = new CosyVoice();
        break
      default:
        this.llm = new LangflowApi();
    }
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [NextChat]: https://github.com/Yidadaa/ChatGPT-Next-Web",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export function getBearerToken(
  apiKey: string,
  noBearer: boolean = false,
): string {
  return validString(apiKey)
    ? `${noBearer ? "" : "Bearer "}${apiKey.trim()}`
    : "";
}

export function validString(x: string): boolean {
  return x?.length > 0;
}

export function getHeaders() {
  const accessStore = useAccessStore.getState();
  const chatStore = useChatStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };


  function getConfig() {
    const modelConfig = chatStore.currentSession().mask.modelConfig;
    const isGoogle = modelConfig.providerName == ServiceProvider.Google;
    const isAzure = modelConfig.providerName === ServiceProvider.Azure;
    const isAnthropic = modelConfig.providerName === ServiceProvider.Anthropic;
    const isBaidu = modelConfig.providerName == ServiceProvider.Baidu;
    const isByteDance = modelConfig.providerName === ServiceProvider.ByteDance;
    const isAlibaba = modelConfig.providerName === ServiceProvider.Alibaba;
    const isMoonshot = modelConfig.providerName === ServiceProvider.Moonshot;
    const isEnabledAccessControl = accessStore.enabledAccessControl();
    const apiKey = isGoogle
      ? accessStore.googleApiKey
      : isAzure
      ? accessStore.azureApiKey
      : isAnthropic
      ? accessStore.anthropicApiKey
      : isByteDance
      ? accessStore.bytedanceApiKey
      : isAlibaba
      ? accessStore.alibabaApiKey
      : isMoonshot
      ? accessStore.moonshotApiKey
      : accessStore.openaiApiKey;
    return {
      isGoogle,
      isAzure,
      isAnthropic,
      isBaidu,
      isByteDance,
      isAlibaba,
      isMoonshot,
      apiKey,
      isEnabledAccessControl,
    };
  }

  function getAuthHeader(): string {
    return isAzure ? "api-key" : isAnthropic ? "x-api-key" : "Authorization";
  }

  const {
    isGoogle,
    isAzure,
    isAnthropic,
    isBaidu,
    apiKey,
    isEnabledAccessControl,
  } = getConfig();

  const authHeader = getAuthHeader();

  const bearerToken = getBearerToken(apiKey, isAzure || isAnthropic);

  if (bearerToken) {
    headers[authHeader] = bearerToken;
  } else if (isEnabledAccessControl && validString(accessStore.accessCode)) {
    headers["Authorization"] = getBearerToken(
      ACCESS_CODE_PREFIX + accessStore.accessCode,
    );
  }

  return headers;
}

export function getClientApi(provider: ServiceProvider): ClientApi {
  switch (provider) {
    case ServiceProvider.Google:
      return new ClientApi(ModelProvider.GeminiPro);
    case ServiceProvider.Anthropic:
      return new ClientApi(ModelProvider.Claude);
    case ServiceProvider.Baidu:
      return new ClientApi(ModelProvider.Ernie);
    case ServiceProvider.ByteDance:
      return new ClientApi(ModelProvider.Doubao);
    case ServiceProvider.Alibaba:
      return new ClientApi(ModelProvider.Qwen);
    case ServiceProvider.Tencent:
      return new ClientApi(ModelProvider.Hunyuan);
    case ServiceProvider.Moonshot:
      return new ClientApi(ModelProvider.Moonshot);
    case ServiceProvider.Langflow:
      return new ClientApi(ModelProvider.Langflow);
    case ServiceProvider.WangX:
        return new ClientApi(ModelProvider.WangX);
    case ServiceProvider.QWenVL:
      return new ClientApi(ModelProvider.QWenVL);
    case ServiceProvider.CogView:
        return new ClientApi(ModelProvider.CogView);
    case ServiceProvider.CogVideoX:
        return new ClientApi(ModelProvider.CogVideoX);
    case ServiceProvider.WenXin:
      return new ClientApi(ModelProvider.WenXin);
    case ServiceProvider.FuYu:
        return new ClientApi(ModelProvider.FuYu);
    case ServiceProvider.QWenDoodle:
        return new ClientApi(ModelProvider.QWenDoodle);
    case ServiceProvider.CosyVoice:
        return new ClientApi(ModelProvider.CosyVoice);
    default:
      return new ClientApi(ModelProvider.GPT);
  }
}
