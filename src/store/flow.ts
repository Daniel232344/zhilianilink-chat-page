import {create} from "zustand";
import {LLMModel, LLMModelProvider} from "@/client/api";
import {createEmptyMask, Mask} from "@/store/mask";
import {ServiceProvider} from "@/pages/chat/constant";
import {api} from "@/api/api"
import {nanoid} from "nanoid";

type StringType = {
  str: string;
  int: number;
  float: number;
  json: Record<string, any>;
};

type GetType<T extends keyof StringType> = StringType[T];

type TweakType = GetType<keyof StringType>;

export function parseInput(type: string, value: string): TweakType | undefined {
  if (!value) {
    return undefined;
  }
  switch (type) {
    case "str":
      return value;
    case "int":
      return parseInt(value);
    case "float":
      return parseFloat(value);
    case "json":
      return JSON.parse(value);
    default:
      throw new Error("Invalid type");
  }
}

export function getExpectInputType(type: string): string {
  switch (type) {
    case "str":
      return "string";
    case "int":
      return "number";
    case "float":
      return "number";
    case "json":
      return "string";
    default:
      throw new Error("Invalid type");
  }
}

export interface Tweak {
  name: string;
  displayName: string;
  description?: string;
  value?: TweakType;
  value_type: string;
}

export interface Component {
  componentId: string;
  tweaks: Tweak[];
}

export interface Flow {
  flowName: string;
  flowId: string;
  components: Component[];
  provider: LLMModelProvider;
}

export interface FlowStore {
  userId: string;
  flows: Flow[];
  refreshFlows: (flowId?:string)=> Promise<void>
  moveFlow: (fromIndex: number, toIndex: number) => void;
  models: () => LLMModel[];
  modelTweaks: (flowId: string) => Tweak[];
  createFlowMask: (flowId: string) => Mask;
  getFlow: (flowId: string) => Flow;
  envs?: Env[];
}

export enum CredentialName {
  // 通义千问
  TongYi_Api_Key = "tongyi_api_key",

  // 百度千帆
  QianFan_Access_Key = "qianfan_access_key",
  QianFan_Secret_Key = "qianfan_secret_key",

  // 智谱
  ZhiPu_Api_Key = "zhipu_api_key",

  // 百川
  BaiChuan_Api_Key = "baichuan_api_key",

  // 混元
  HunYuan_Secret_Id = "hunyuan_secret_id",
  HunYuan_Secret_Key = "hunyuan_secret_key",

  // kimi
  MoonShot_API_Key = "moonshot_api_key",

  // minimax
  MiniMax_Group_Id = "minimax_group_id",
  MiniMax_Api_Key = "minimax_api_key",

  // 商汤
  SenseTime_Api_Key_Id = "sensetime_api_key_id",
  SenseTime_Api_Key = "sensetime_api_key",

  Spark_App_Id = "spark_app_id",
  Spark_access_key = "spark_access_key",
  Spark_secret_key = "spark_secret_key",

  // 火山方舟
  Volc_Api_Key = "volc_api_key",
}

export interface Env {
  name: string;
  value: string;
  displayName? : string;
}

const initialFlowStore: FlowStore = {
  userId: "",
  flows: [] as Flow[],
  envs: [ ] as Env[],
  refreshFlows: async () => {
    throw new Error("Not implemented");
  },
  moveFlow: () => {},
  models: () => [],
  modelTweaks: (flowId) => [],
  createFlowMask: (flowId) => {
    throw new Error("Not implemented");
  },
  getFlow: (flowId) => {
    throw new Error("Not implemented");
  },
};

function buildFlow(flow: any): Flow {
  const flowId = flow.flowId as string;
  const flowName = flow.flowName as string;
  const nodes = flow.data.nodes;
  const components: Component[] = [];
  for (const node of nodes) {
    const tweaks = node.data.node.tweaks;
    if (!tweaks){ continue }
    const nodeId = node.id;
    const nodeTweaks: Tweak[] = [];
    for (const tweak of tweaks) {
      const newTweak: Tweak = {
        name: tweak.name,
        displayName: tweak.display_name,
        description: tweak?.description,
        value: tweak?.default,
        value_type: tweak.value_type,
      };
      nodeTweaks.push(newTweak);
    }
    components.push({ componentId: nodeId, tweaks: nodeTweaks });
  }
  return { flowId: flowId, flowName: flowName, components: components , provider: { id:"langflow", providerName:"Langflow", providerType:"langflow",}};
}

export interface RunFlowRequestBody {
  input_value: string;
  input_type: string;
  output_type: string;
  stream: boolean;
  tweaks: {
    [key: string]: {
      [key: string]: TweakType;
    };
  };
}

export function getRunFlowRequestBody(
  input: string,
  stream: boolean,
  components: Component[],
): RunFlowRequestBody {
  const tweaks = {} as RunFlowRequestBody;
  tweaks["input_value"] = input;
  tweaks["input_type"] = "chat";
  tweaks["output_type"] = "chat";
  tweaks["tweaks"] = {};
  for (const component of components) {
    const componentTweaks = {} as { [key: string]: TweakType };
    for (const tweak of component.tweaks) {
      if (tweak.value) {
        componentTweaks[tweak.name] = tweak.value;
      }
    }
    tweaks["tweaks"][component.componentId] = componentTweaks;
  }
  tweaks["stream"] = stream;
  return tweaks;
}

const DEFAULT_FLOWS: Flow[] = [
  {
    flowName: "ilink-小链对话",
    flowId: "9184898F-01B3-36B8-153E-98456B70527L",
    components: [],
    provider: {
      id: "ilink",
      providerName: "ILink",
      providerType: "ilink",
    }
  },
  {
    flowName: "论文阅读助手",
    flowId: "9184898F-01B3-36B8-153E-98456B70527G",
    components: [],
    provider: {
      id: "ilink",
      providerName: "ILink",
      providerType: "ilink",
    }
  },
  {
    flowName: "通义千问模型助手",
    flowId: "9184898F-01B3-36B8-153E-98456B70527H",
    components: [],
    provider: {
      id: "ilink",
      providerName: "ILink",
      providerType: "ilink",
    }
  },
  {
    flowName: "Fuyu-8B",
    flowId: "9184898F-01B3-36B8-153E-98456B70527M",
    components: [{
      componentId: "6FCF921C-FC60-42F6-BA9F-14FDBAEB1794",
      tweaks: [{
        name: CredentialName.QianFan_Access_Key,
        displayName: "Access Key",
        value_type: "str",
      }, {
        name: CredentialName.QianFan_Secret_Key,
        displayName: "Secret Key",
        value_type: "str",
      }]
    }],
    provider: {
      id: "fuyu",
      providerName: "FuYu",
      providerType: "FuYu",
    }
  },
  {
    flowName: "通义CosyVoice文生音频",
    flowId: "9ED164D9-DCBF-A939-5441-A021FC2A27DF",
    components: [{
      componentId: "358D5F71-B9EB-17A9-4CE0-578FC0810A67",
      tweaks: [{
        name:CredentialName.TongYi_Api_Key,
        displayName:"API Key",
        value_type:"str",
      }]
    }],
    provider:{
      id:"cosyvoice",
      providerName:"CosyVoice",
      providerType:"cosyvoice",
    }
  },
  {
    flowName: "通义万相涂鸦",
    flowId: "ADB7DDDE-2A3B-F6FE-3BF9-6E0082DC3077",
    components: [{
      componentId: "930BE7DA-6787-7D33-0C14-38B0DDFB694A",
      tweaks: [{
        name:CredentialName.TongYi_Api_Key,
        displayName:"API Key",
        value_type:"str",
      }]
    }],
    provider:{
      id:"qwendoodle",
      providerName:"QWenDoodle",
      providerType:"qwendoodle",
    }
  },
  {
    flowName: "文心一格",
    flowId: "9184898F-01B3-36B8-153E-98456B70527F",
    components: [{
      componentId: "6FCF921C-FC60-42F6-BA9F-14FDBAEB1790",
      tweaks: [{
        name: CredentialName.QianFan_Access_Key,
        displayName: "Access Key",
        value_type: "str",
      }, {
        name: CredentialName.QianFan_Secret_Key,
        displayName: "Secret Key",
        value_type: "str",
      }]
    }],
    provider: {
        id: "wenxin",
        providerName: "WenXin",
        providerType: "WenXin",
    }
  },
    {
      flowName: "千问VL",
      flowId: "39EFB549-0E2B-DBA4-BDB6-BCCCA5B62316",
      components: [{
        componentId: "93DBBB30-6D7C-8A39-C00D-94F59E5A2DB9",
        tweaks: [{
          name: CredentialName.TongYi_Api_Key,
          displayName:"API Key",
          value_type:"str",
        }]
      }],
      provider:{
        id:"qwenvl",
        providerName:"QWenVL",
        providerType:"qwenvl",
      }
    },
    {
      flowName: "通义万相",
      flowId: "9184898F-01B3-36B8-153E-98456B70527E",
      components: [{
          componentId: "2C060E0E-C704-6750-4D48-194D414B843C",
          tweaks: [{
              name:CredentialName.TongYi_Api_Key,
              displayName:"API Key",
              value_type:"str",
            }]
        }],
      provider:{
          id:"wangx",
          providerName:"WangX",
          providerType:"wangx",
      }
    },
  {
    flowName: "智谱文生图",
    flowId: "E78DF753-9B6F-DCCC-F00C-40B572600697",
    components: [{
      componentId: "01EE8B08-A8DC-F3CC-D1BB-E7FD200512D8",
      tweaks: [{
        name:CredentialName.ZhiPu_Api_Key,
        displayName:"API Key",
        value_type:"str",
      }]
    }],
    provider:{
      id:"cogview",
      providerName:"CogView",
      providerType:"CogView",
    }
  },
  {
    flowName: "智谱文图生视频",
    flowId: "949adff6-bf5a-4d02-a2cf-4c88bd9e822c",
    components: [{
      componentId: "205d00a1-a348-4a4a-891b-51d3c3ef60f8",
      tweaks: [{
        name:CredentialName.ZhiPu_Api_Key,
        displayName:"API Key",
        value_type:"str",
      }]
    }],
    provider:{
      id:"cogvideox",
      providerName:"CogVideoX",
      providerType:"CogVideoX",
    }
  }
]


export const useFlowStore = create<FlowStore>((set, get) => ({
  ...initialFlowStore,

  moveFlow: (fromIndex: number, toIndex: number) => {
    const flows = get().flows;
    const newFlows = [...flows];
    const [removed] = newFlows.splice(fromIndex, 1);
    newFlows.splice(toIndex, 0, removed);
    set({ flows: newFlows });
  },

  getFlow: (flowId: string) => {
    const flow = get().flows.find((flow) => flow.flowId === flowId);
    if (!flow) {
      throw new Error("Invalid flowId");
    }
    return flow;
  },

  refreshFlows: async (flowId?: string)  => {
    await api.get("/java/ground/langflow_app/chat_flows", {
        params: { flowId: flowId }
    }).then((res) => {
        const data = res.data.data;
        const result: Flow[] = [];
        for (const flow of data) {
            result.push(buildFlow(flow));
        }
        set({ flows: result.concat(DEFAULT_FLOWS) });
    })
    await api.get("/java/ground/langflow_app/envs").then((res) => {
        const data = res.data.data as Env[];
        set({ envs: data });
    })
  },

  models: () => {
    const flows = get().flows;
    return flows.map((flow) => ({
      name: flow.flowId,
      displayName: flow.flowName,
      available: true,
      provider: flow.provider
    })) as LLMModel[];
  },

  modelTweaks: (flowId: string) => {
    return get()
      .getFlow(flowId)
      .components.flatMap((component) => component.tweaks);
  },

  createFlowMask: (flowId: string) => {
    const mask = createEmptyMask();
    const flow = get().getFlow(flowId);
    mask.modelConfig.components = flow.components;
    mask.modelConfig.components = get().getFlow(flowId).components;
    mask.modelConfig.model = flowId;
    mask.modelConfig.providerName = flow.provider.providerName as ServiceProvider;
    mask.modelConfig.displayName = flow.flowName;
    mask.syncGlobalConfig = false;
    return mask;
  },
}));
