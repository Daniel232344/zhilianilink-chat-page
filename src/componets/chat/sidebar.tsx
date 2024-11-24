import React, {Fragment, useEffect, useMemo, useRef, useState} from "react";
import styles from "./home.module.scss";
import DragIcon from "@/icons/drag.svg";
import {Flow, useAppConfig, useChatStore, useFlowStore,} from "@/store";
import {
    DEFAULT_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH,
    MIN_SIDEBAR_WIDTH,
    NARROW_SIDEBAR_WIDTH,
    Path,
} from "@/pages/chat/constant";
import {useNavigate, useParams} from "react-router-dom";
import {isIOS, useMobileScreen} from "@/pages/chat/utils";
import {Avatar, Button, Input, Menu} from "antd";
import {AppstoreOutlined, PlusOutlined, RobotOutlined,} from "@ant-design/icons";
import SubMenu from "antd/es/menu/SubMenu";
import img1 from "@/assets/1.jpg";
import img2 from "@/assets/33.jpg";

import {ChatList} from "@/componets/chat/chat-list.tsx";
import QuickStartModal from "./QuickStartModal.tsx";


export function useHotKey() {
    const chatStore = useChatStore();
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.altKey || e.ctrlKey) {
                if (e.key === "ArrowUp") {
                    chatStore.nextSession(-1);
                } else if (e.key === "ArrowDown") {
                    chatStore.nextSession(1);
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });
}

export function useDragSideBar() {
    const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);
    const config = useAppConfig();
    const startX = useRef(0);
    const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const lastUpdateTime = useRef(Date.now());

    const toggleSideBar = () => {
        config.update((config) => {
            if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
                config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
            } else {
                config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
            }
        });
    };

    const onDragStart = (e: MouseEvent) => {
        startX.current = e.clientX;
        startDragWidth.current = config.sidebarWidth;
        const dragStartTime = Date.now();

        const handleDragMove = (e: MouseEvent) => {
            if (Date.now() < lastUpdateTime.current + 20) {
                return;
            }
            lastUpdateTime.current = Date.now();
            const d = e.clientX - startX.current;
            const nextWidth = limit(startDragWidth.current + d);
            config.update((config) => {
                if (nextWidth < MIN_SIDEBAR_WIDTH) {
                    config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
                } else {
                    config.sidebarWidth = nextWidth;
                }
            });
        };

        const handleDragEnd = () => {
            window.removeEventListener("pointermove", handleDragMove);
            window.removeEventListener("pointerup", handleDragEnd);
            const shouldFireClick = Date.now() - dragStartTime < 300;
            if (shouldFireClick) {
                toggleSideBar();
            }
        };

        window.addEventListener("pointermove", handleDragMove);
        window.addEventListener("pointerup", handleDragEnd);
    };

    const isMobileScreen = useMobileScreen();
    const shouldNarrow =
        !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

    useEffect(() => {
        const barWidth = shouldNarrow
            ? NARROW_SIDEBAR_WIDTH
            : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
        const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
        document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
    }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

    return {
        onDragStart,
        shouldNarrow,
    };
}

export function SideBarContainer(props: {
    children: React.ReactNode;
    onDragStart: (e: MouseEvent) => void;
    shouldNarrow: boolean;
    className?: string;
}) {
    const isMobileScreen = useMobileScreen();
    const isIOSMobile = useMemo(
        () => isIOS() && isMobileScreen,
        [isMobileScreen],
    );
    const {children, className, onDragStart, shouldNarrow} = props;
    return (
        <div
            className={`${styles.sidebar} ${className} ${
                shouldNarrow && styles["narrow-sidebar"]
            }`}
            style={{
                transition: isMobileScreen && isIOSMobile ? "none" : undefined,
            }}
        >
            {children}
            <div
                className={styles["sidebar-drag"]}
                onPointerDown={(e) => onDragStart(e as any)}
            >
                <DragIcon/>
            </div>
        </div>
    );
}

export function SideBarHeader(props: {
    logo?: React.ReactNode;
    children?: React.ReactNode;
    shouldNarrow: boolean;
}) {
    const {logo, children, shouldNarrow} = props;
    // const navigate = useNavigate();
    // const squareUrl = import.meta.env.VITE_HOME_PAGE_URL + import.meta.env.VITE_SQUARE_URL;
    // const handleCreate = () => {
    //     window.location.href = squareUrl;
    // }
    const [isModalVisible, setIsModalVisible] = useState(false);
    // const showModal = () => {
    //     setIsModalVisible(true);
    // };

    // 关闭模态框
    const closeModal = () => {
        setIsModalVisible(false);
    };
    return (
        <>
            <Fragment>
                <div className={styles["sidebar-header"]} data-tauri-drag-region>
                    <div className={styles["sidebar-logo"] + " no-dark"}>{logo}</div>
                </div>
                <div className={styles["header-buttons"]}>
                    {/*<Button*/}
                    {/*style={{ background:'linear-gradient(90deg, #106feb, #7cc7f9)'}}*/}
                    {/*  type="primary"*/}
                    {/*  className={styles.createButton}*/}
                    {/*  onClick={showModal}*/}
                    {/*>*/}
                    {/*  <PlusOutlined /> 创建应用*/}
                    {/*</Button>*/}
                    {/*<Button*/}
                    {/* style={{ background:'linear-gradient(90deg, #106feb, #7cc7f9)'}}*/}
                    {/*  type="primary"*/}
                    {/*  className={styles.marketButton}*/}
                    {/*  onClick={*/}
                    {/*    handleCreate*/}
                    {/*  }*/}
                    {/*>*/}
                    {/*  <RobotOutlined /> 创新广场*/}
                    {/*</Button>*/}
                </div>
                {children}
            </Fragment>
            <QuickStartModal visible={isModalVisible} onClose={closeModal}/>
        </>
    );
}

export function SideBarBody(props: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}) {
    const {onClick, children} = props;
    return (
        <div className={styles["sidebar-body"]} onClick={onClick}>
            {children}
        </div>
    );
}

export function SideBarTail(props: {
    primaryAction?: React.ReactNode;
    secondaryAction?: React.ReactNode;
}) {
    const {primaryAction, secondaryAction} = props;
    return (
        <div className={styles["sidebar-tail"]}>
            <div className={styles["sidebar-actions"]}>{primaryAction}</div>
            <div className={styles["sidebar-actions"]}>{secondaryAction}</div>
        </div>
    );
}

export function SideBar(props: { className?: string }) {
    useHotKey();
    const [refreshFlows, flows, modelTweaks, createFlowMask] = useFlowStore(
        (state) => [
            state.refreshFlows,
            state.flows,
            state.modelTweaks,
            state.createFlowMask,
        ],
    );
    const {onDragStart, shouldNarrow} = useDragSideBar();
    const [showPluginSelector, setShowPluginSelector] = useState(false);
    const navigate = useNavigate();
    const config = useAppConfig();
    const chatStore = useChatStore();
    const {flowId} = useParams();
    useEffect(() => {
        refreshFlows(flowId).then(() => {
            if (flowId) {
                const mask = createFlowMask(flowId);
                chatStore.newSession(mask);
            }
        });

        const interval = setInterval(() => {
            refreshFlows();
        }, 30 * 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);
    const activeApp = useChatStore().currentSession().mask.modelConfig.model
    const selectedApp = activeApp;

    const handleNewChatClick = (flow: Flow) => {
        const mask = createFlowMask(flow.flowId);
        chatStore.newSession(mask);
    };
    const handleBack = () => {
        window.location.href = import.meta.env.VITE_HOME_PAGE_URL + import.meta.env.VITE_AGENT_URL;
    }
    const [searchTerm, setSearchTerm] = useState('');
    return (
        <SideBarContainer
            onDragStart={onDragStart}
            shouldNarrow={shouldNarrow}
            {...props}
        >
            <SideBarHeader shouldNarrow={shouldNarrow}>
                <div className={styles["sidebar-header-bar"]}>
                    <div className={styles["sidebar-action"]}>
                        <Menu
                            mode="inline"
                            selectedKeys={[selectedApp]}
                            defaultOpenKeys={['myApps']}
                            style={{
                                borderRight: 0,
                                fontSize: "1.1rem",
                                padding: "0.625rem 0",
                            }}
                        >
                            <SubMenu
                                key="myApps"
                                title="我的应用"
                                icon={
                                    <img
                                        src={img2}
                                        alt="我的应用"
                                        style={{
                                            width: "1.2rem",
                                            height: "1.2rem",
                                            marginRight: "0px",
                                        }}
                                    />
                                }
                                className={styles.scrollContainer}
                                style={{
                                    marginBottom: "0.9375rem",
                                    width: "265px",
                                    maxHeight: "calc(5 * 48px)", // 设定最大高度为5个项目的高度，每个项目大约48px
                                    overflowY: "auto",
                                    overflowX: 'hidden'
                                }}
                            >
                                {flows.map((flow) => (
                                    <Menu.Item
                                        key={flow.flowName}
                                        onClick={() => handleNewChatClick(flow)}
                                        style={{
                                            marginBottom: "12px",
                                            width: "200px",
                                            borderLeft:
                                                flow.flowId === activeApp
                                                    ? "4px solid #6286de"
                                                    : "1px solid #cdc8c8",
                                            fontSize: "16px",
                                            marginLeft: "2.25rem",
                                            borderRadius: "0px",
                                            paddingLeft: "18px",
                                        }}
                                    >
                                        <Avatar src={img1} style={{marginRight: "0.5rem"}}/>{" "}
                                        {flow.flowName}
                                    </Menu.Item>
                                ))}
                            </SubMenu>
                            <Menu.Item
                                onClick={handleBack}
                                key="appMarket"
                                style={{marginBottom: "0.7rem"}}
                                icon={<AppstoreOutlined style={{fontSize: "1.25rem"}}/>}
                            >
                                应用广场
                            </Menu.Item>
                        </Menu>
                    </div>
                </div>
            </SideBarHeader>
            <div className={styles.section}>
                <div className={styles.searchHistory}>
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜索历史记录"
                        style={{color: '#000', height: 'auto'}}
                    />
                </div>
                <SideBarBody
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            navigate(Path.Home);
                        }
                    }}
                >
                    <ChatList
                        narrow={shouldNarrow} searchTerm={searchTerm}/>
                </SideBarBody>

            </div>
        </SideBarContainer>

    );
}
