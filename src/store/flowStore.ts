/*
 * @Author: 谢子健 1075010289@qq.com
 * @Date: 2024-09-07 16:06:23
 * @LastEditors: 谢子健 1075010289@qq.com
 * @LastEditTime: 2024-09-08 16:37:43
 * @FilePath: \zhilianilink\src\store\flowStore.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import create from 'zustand';

interface Flow {
  id: string;
  name: string;
  description: string;
  [key: string]: any; // 完整 flow 对象可能包含其他字段
}

interface FlowState {
  flows: Flow[]; // 简化的 flow 数据
  fullFlows: Flow[]; // 完整的 flow 数据
  folderId: string | null; // 当前选中的文件夹ID
  setFolderId: (folderId: string | null) => void; // 存储选中的文件夹ID
  setFlows: (newFlows: Flow[]) => void; // 存储简化的 flow 数据
  setFullFlows: (newFullFlows: Flow[]) => void; // 存储完整的 flow 数据
}

export const useFlowStore = create<FlowState>((set) => ({
  flows: [],
  fullFlows: [],
  folderId: null, // 初始状态为空
  setFolderId: (folderId) => set({ folderId }), // 设置选中的文件夹ID
  setFlows: (newFlows) => set({ flows: newFlows }),
  setFullFlows: (newFullFlows) => set({ fullFlows: newFullFlows }),
}));
