"use client";
import {} from "@/pages/chat/polyfill"
import { useState, useEffect } from "react";
import styles from "./home.module.scss";
import BotIcon from "@/icons/bot.svg";
import LoadingIcon from "@/icons/three-dots.svg";
import { getCSSVar, useMobileScreen } from "@/pages/chat/utils";
import { Path, SlotID } from "@/pages/chat/constant";
import { ErrorBoundary } from "./error";
import { getISOLang, getLang } from "@/locales";
import {HashRouter as Router, Routes, Route, useLocation, Outlet} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "@/store/config";
import { AuthPage } from "./auth";
import { type ClientApi, getClientApi } from "@/client/api";
import { useAccessStore } from "@/store";
import AppHeader from "./AppHeader";
import { Layout } from "antd";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}
import {Artifacts} from "@/componets/chat/artifacts.tsx";
import {Settings} from "@/componets/chat/settings.tsx";
import  {Chat} from "@/componets/chat/chat.tsx";
import {NewChat} from "@/componets/chat/new-chat.tsx";
import {MaskPage} from "@/componets/chat/mask.tsx";
import {Sd} from "@/componets/chat/sd";
import {AlertOutlined} from "@ant-design/icons";

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl = proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

export function WindowContent(props: { children: React.ReactNode }) {
  return (
    <div className={styles["window-content"]} id={SlotID.AppBody}>
      {props?.children}
    </div>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isSd = location.pathname === Path.Sd;
  const isSdNew = location.pathname === Path.SdNew;

  const isMobileScreen = useMobileScreen();
  const shouldTightBorder = (config.tightBorder && !isMobileScreen);

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }
  const renderContent = () => {
    if (isAuth) return <AuthPage />;
    if (isSd) return <Sd />;
    if (isSdNew) return <Sd />;
    return (
      <Layout style={{ height: "100vh" }}>
        <AppHeader />
        <Layout style={{ display: "flex", flexDirection: "row" }}>
          <SideBar className={isHome ? styles["sidebar-show"] : ""} />
          <WindowContent>
            <Outlet/>
            {/*<Routes>*/}
            {/*  <Route path={Path.Home} element={<Chat />} />*/}
            {/*  <Route path={Path.NewChat} element={<NewChat />} />*/}
            {/*  <Route path={Path.Masks} element={<MaskPage />} />*/}
            {/*  <Route path={Path.Chat} element={<Chat />} />*/}
            {/*  <Route path={Path.Settings} element={<Settings />} />*/}
            {/*</Routes>*/}
          </WindowContent>
        </Layout>
      </Layout>
    );
  };

  return (
    <div
      className={`${styles.container} ${
        shouldTightBorder ? styles["tight-container"] : styles.container
      } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`}
    >
      {renderContent()}
    </div>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  const api: ClientApi = getClientApi(config.modelConfig.providerName);

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    // useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  return (
    <ErrorBoundary>
        <Screen />
    </ErrorBoundary>
  );
}
