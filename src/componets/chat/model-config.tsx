import { ServiceProvider } from "@/pages/chat/constant";
import {
  ModalConfigValidator,
  ModelConfig,
  useFlowStore,
  getExpectInputType,
  parseInput,
} from "@/store";

import Locale from "@/locales";
import { InputRange } from "./input-range";
import { ListItem, Select } from "./ui-lib";
import { AutoComplete } from "antd"

export function ModelConfigList(props: {
  modelConfig: ModelConfig;
  updateConfig: (updater: (config: ModelConfig) => void) => void;
}) {
  const flowModels = useFlowStore((state) => state.models());
  const value = `${props.modelConfig.model}@${props.modelConfig?.providerName}`;
  const components = props.modelConfig.components;
  const createFlowMask = useFlowStore((state) => state.createFlowMask);
  const  envs = useFlowStore((state) => state.envs);

  return (
    <>
      <ListItem title={Locale.Settings.Model}>
        <Select
          value={value}
          onChange={(e) => {
            const [model, ] = e.currentTarget.value.split("@");
            const newConfig = createFlowMask(model).modelConfig
            props.updateConfig((config) => {
                Object.assign(config, newConfig);
            });
          }}
        >
          {flowModels
            .filter((v) => v.available)
            .map((v, i) => (
              <option value={`${v.name}@${v.provider?.providerName}`} key={i}>
                {v.displayName}({v.provider?.providerName})
              </option>
            ))}
        </Select>
      </ListItem>
      {components &&
        components.map((component, componentIndex) => {
          return (
            component.tweaks &&
            component.tweaks.map((tweak, tweakIndex) => {
              return (
                <ListItem
                  title={tweak.displayName}
                  subTitle={tweak.description}
                  key={tweakIndex}
                >
                    <AutoComplete
                        style={{ width: 200 }}
                        placeholder="请选择或输入内容"
                        value={tweak.value?.toString() ?? ""}
                        onChange={(value) => {
                            const i = componentIndex;
                            const j = tweakIndex;
                            props.updateConfig(
                                (config) =>
                                    (config.components[i].tweaks[j].value = parseInput(
                                        tweak.value_type,
                                        value
                                    )),
                            );
                        }}>
                    {
                        envs && envs.map((env, index) => {
                            if (env.name == tweak.name) {
                                return (
                                    <AutoComplete.Option value={env.value} key={index}>
                                        {env.displayName ?? env.name}
                                    </AutoComplete.Option>
                                )
                            }
                        })
                    }
                    </AutoComplete>
                </ListItem>
              );
            })
          );
        })}
      {props.modelConfig?.providerName == ServiceProvider.Google ? null : (
        <>
          <ListItem
            title={Locale.Settings.InjectSystemPrompts.Title}
            subTitle={Locale.Settings.InjectSystemPrompts.SubTitle}
          >
            <input
              type="checkbox"
              checked={props.modelConfig.enableInjectSystemPrompts}
              onChange={(e) =>
                props.updateConfig(
                  (config) =>
                    (config.enableInjectSystemPrompts =
                      e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.InputTemplate.Title}
            subTitle={Locale.Settings.InputTemplate.SubTitle}
          >
            <input
              type="text"
              value={props.modelConfig.template}
              onChange={(e) =>
                props.updateConfig(
                  (config) => (config.template = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </>
      )}
      <ListItem
        title={Locale.Settings.HistoryCount.Title}
        subTitle={Locale.Settings.HistoryCount.SubTitle}
      >
        <InputRange
          title={props.modelConfig.historyMessageCount.toString()}
          value={props.modelConfig.historyMessageCount}
          min="0"
          max="64"
          step="1"
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.historyMessageCount = e.target.valueAsNumber),
            )
          }
        ></InputRange>
      </ListItem>

      <ListItem
        title={Locale.Settings.CompressThreshold.Title}
        subTitle={Locale.Settings.CompressThreshold.SubTitle}
      >
        <input
          type="number"
          min={500}
          max={4000}
          value={props.modelConfig.compressMessageLengthThreshold}
          onChange={(e) =>
            props.updateConfig(
              (config) =>
                (config.compressMessageLengthThreshold =
                  e.currentTarget.valueAsNumber),
            )
          }
        ></input>
      </ListItem>
      <ListItem title={Locale.Memory.Title} subTitle={Locale.Memory.Send}>
        <input
          type="checkbox"
          checked={props.modelConfig.sendMemory}
          onChange={(e) =>
            props.updateConfig(
              (config) => (config.sendMemory = e.currentTarget.checked),
            )
          }
        ></input>
      </ListItem>
    </>
  );
}
