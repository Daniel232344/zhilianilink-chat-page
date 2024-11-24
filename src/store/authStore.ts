// src/store/authStore.ts
import create from 'zustand';

// src/store/authStore.ts
import {api} from "@/api/api.tsx";
import {Cookies} from "react-cookie";

export const refreshToken = async () => {
  try {
    const response = await api.post("/java/user/refresh");
    return response.data;
  } catch (error) {
    throw new Error("刷新 Token 失败");
  }
};

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  intervalId: number | null;
  initialize: () => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
  setRefreshToken: (token: string) => void;
  clearRefreshToken: () => void;
  startTokenRefreshTask: () => void;
  stopTokenRefreshTask: () => void;
}

const cookies = new Cookies();

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  intervalId: null,

  // 初始化函数，从 cookies 中获取 token
  initialize: () => {
    const token1 = cookies.get('access_token_lf');
    const token2 = cookies.get('refresh_token_lf');
    if (token1 && token2) {
      set({ accessToken: token1, refreshToken: token2 });
    }
  },

  // 设置 access token，并存储在 cookies 中
  setAccessToken: (token: string) => {
    cookies.set('access_token_lf', token);
    set({ accessToken: token });
  },

  // 设置 refresh token，并存储在 cookies 中
  setRefreshToken: (token: string) => {
    cookies.set('refresh_token_lf', token);
    set({ refreshToken: token });
  },

  // 清除 access token，并从 cookies 中移除
  clearAccessToken: () => {
    cookies.remove('access_token_lf');
    set({ accessToken: null });
  },

  // 清除 refresh token，并从 cookies 中移除
  clearRefreshToken: () => {
    cookies.remove('refresh_token_lf');
    set({ refreshToken: null });
  },

  logout: () => {
    get().clearAccessToken();
    get().clearRefreshToken();
  },

  // 启动定时刷新 token 的任务
  startTokenRefreshTask: () => {
    const { intervalId } = get();
    if (intervalId) return; // 防止多次启动定时器

    const newIntervalId = window.setInterval(() => {
      refreshToken().then(
        (data) => {
          const { access_token, refresh_token } = data;
          get().setAccessToken(access_token);
          get().setRefreshToken(refresh_token);
        },
        () => {
          get().clearAccessToken();
          get().clearRefreshToken();
        }
      )
    }, 20 * 60 * 1000); // 每 20 分钟刷新一次 token

    set({ intervalId: newIntervalId });
  },
  // 停止定时刷新 token 的任务
  stopTokenRefreshTask: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
      set({ intervalId: null });
    }
  },
}));

