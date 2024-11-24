import create from 'zustand';

interface App {
  flowName: string;
  description: string;
  userName: string;
  tags: Array<{ tagId: string; tagName: string }>;
}

interface AppsState {
  apps: App[];
  setApps: (apps: App[]) => void;
}

export const useAppsStore = create<AppsState>((set) => ({
  apps: [],
  
  // 添加 console.log 来检查传入的数据
  setApps: (apps: App[]) => {
    console.log('Setting apps:', apps); // 打印传入的 apps 数据
    set({ apps });
    
    // 立即打印存储后的状态
    set((state) => {
      console.log('Updated apps state:', state.apps);
      return { apps: state.apps };
    });
  },
}));
