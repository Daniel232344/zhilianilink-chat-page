import {useEffect, useState} from "react";
import {useAuthStore} from "@/store/authStore.ts";
import axios from "axios";

// Helper function to get a specific cookie by name
import React from 'react';
import {Flex, Spin} from 'antd';

const CountDown = ({count, onFinish}: {
    count: number
    onFinish?: () => void
}) => {
    const [time, setTime] = useState(count);
    useEffect(() => {
        const timer = setInterval(() => {
            setTime((prev) => {
                if (prev === 1) {
                    clearInterval(timer);
                    onFinish && onFinish();
                    return 0;
                }
                return prev - 1;
            })
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, [count]);
    return <span>{time}</span>;
}

const Redirect = ({url, time}:
                      {
                          url: string
                          time: number
                      }
) => {
    return (<Loading Component={() => (
            <div>
                登录已过期，
                <CountDown count={time} onFinish={() => {
                    window.location.href = url
                }}/>
                秒后跳转到登录页
            </div>
        )}/>
    )
}

const Loading = ({Component = null}) => {
    return (
        <Flex justify="center" align="center" style={{height: '100vh'}}>
            <Spin size="large"/>
            {Component && <Component/>}
        </Flex>
    )
}

const InitAuth = (props) => {
    const {initialize} = useAuthStore();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        initialize();
        setLoading(false);
    }, []);
    return loading ? <Loading Component={() => (<span>加载中...</span>)}/> : <>{props.children}</>;
}
const CheckAuth = (props) => {
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const {accessToken, startTokenRefreshTask, stopTokenRefreshTask} = useAuthStore();
    const loginUrl = import.meta.env.VITE_HOME_PAGE_URL + import.meta.env.VITE_LOGIN_URL;
    useEffect(() => {
        if (accessToken === null) {
            setIsValid(false);
        } else {
            axios.get('/java/user/whoami_frontend', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }).then((res) => {
                setIsValid(res.data.code === 200);
            }).catch(() => {
                setIsValid(false);
            });
        }
    }, [accessToken]);

    useEffect(() => {
        if (isValid) {
            startTokenRefreshTask();
        }
        return () => {
            stopTokenRefreshTask();
        }
    }, [isValid])
    return (
        <div>
            {isValid === null ? (
                <Flex justify="center" align="center" style={{height: '100vh'}}>
                    <Spin size="large"/>
                </Flex>
            ) : isValid === false ? (
                <Redirect url={loginUrl} time={3}/>
            ) : (
                <div>{props.children}</div>
            )}
        </div>
    )
}

const Auth = (props) => {
    return (
        <InitAuth>
            <CheckAuth>
                {props.children}
            </CheckAuth>
        </InitAuth>
    );

};

export default Auth;
