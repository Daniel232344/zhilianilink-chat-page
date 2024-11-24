/*
 * @Author: 谢子健 1075010289@qq.com
 * @Date: 2024-08-26 21:46:59
 * @LastEditors: 谢子健 1075010289@qq.com
 * @LastEditTime: 2024-09-12 21:23:12
 * @FilePath: \zhilianilink\src\api\api.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {Cookies} from "react-cookie";
import axios, { AxiosInstance, AxiosResponse, HttpStatusCode } from 'axios'
import {useAuthStore} from "@/store/authStore.ts";

// Create a new Axios instance
const api: AxiosInstance = axios.create({
    baseURL: '',
    timeout: 50000, // 全局超时时间
})

/*
  * Axios请求拦截器，对请求进行处理
  */
api.interceptors.request.use(
    (config) => {
        const controller = new AbortController()
        const accessToken = useAuthStore.getState().accessToken
        if (accessToken){
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return {
            ...config,
            signal: controller.signal,
        }
    },
    (error) => {
        return Promise.reject(error)
    },
)

/**
 * 正常返回时的响应拦截器处理函数
 * @param response 响应结果
 * @returns 如果响应成功，则返回响应的data属性；否则，抛出错误或者执行其他操作
 */
const handleResponse = (response: AxiosResponse<any>) => {
    // note: 具体错误判断
    // 判断是否是401，401也需要重新登录
    const status = Number(response.data.code)
    if (status == null){
        throw response.data
    }

    if (status === HttpStatusCode.Unauthorized) {
        useAuthStore.getState().logout()
        return Promise.reject(new Error('Need to login again'))
    }

    // 处理普遍其他异常
    if (status !== HttpStatusCode.Ok){
        return Promise.reject(response.data)
    }

    return response
}

/*
  * Axios响应拦截器，对响应进行处理
  */
api.interceptors.response.use(
    handleResponse, (error) => {
        const status = Number(error.response.status) || 200
        if (status === HttpStatusCode.Unauthorized) {
            useAuthStore.getState().logout()
            return Promise.reject(new Error('Need to login again'))
        }
        return Promise.reject(error.response.data)
    },
)

export { api }
