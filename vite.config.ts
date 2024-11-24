import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
        const env = loadEnv(mode, process.cwd());   // 获取.env文件里定义的环境变量
        // const routerBase = "^" + env.VITE_ROUTER_BASENAME + "(.*)";
        return {
            base: env.VITE_ROUTER_BASENAME,
            plugins: [react(), svgr({
                include: "src/icons/*.svg"
            })],
            resolve: {
                alias: {
                    '@': path.resolve(__dirname, './src'),
                },
            },
            server: {
                host: "0.0.0.0",
                proxy: {
                    // 取消 '/java' 路由
                    // [routerBase]: {
                    //     target: "http://" + env.VITE_LOCAL_IP,
                    //     rewrite: (path) => path.replace(new RegExp(`^${env.VITE_ROUTER_BASE_NAME}`), ''),
                    // },
                    '^/java(.*)': {
                        target: 'http://' + env.VITE_JAVA_IP,
                        rewrite: (path) => path.replace(/^\/java/, '')
                    },
                    // 取消 '/python' 路由
                    '^/python(.*)': {
                        target: 'http://' + env.VITE_PYTHON_IP,
                        rewrite: (path) => path.replace(/^\/python/, '')
                    },
                    '^/dashscope(.*)': {
                        target: env.VITE_DASHSCOPE_URL,
                        changeOrigin: true,  // 修改请求头中的origin为目标服务器
                        secure: false,  // 如果是 HTTPS 接口，但不想检查 SSL 证书时设置为 false
                        rewrite: (path) => path.replace(/^\/dashscope/, '')
                    },
                    // 取消质谱AI路由
                    '^/mass-spectrometry(.*)': {
                        target: env.VITE_ZHIPUAI_URL,
                        changeOrigin: true,  // 修改请求头中的origin为目标服务器
                        secure: false,  // 如果是 HTTPS 接口，但不想检查 SSL 证书时设置为 false
                        rewrite: (path) => path.replace(/^\/mass-spectrometry/, '')
                    },
                    '^/wenxin(.*)': {
                        target: env.VITE_WENXIN_URL,
                        changeOrigin: true,  // 修改请求头中的origin为目标服务器
                        secure: false,  // 如果是 HTTPS 接口，但不想检查 SSL 证书时设置为 false
                        rewrite: (path) => path.replace(/^\/wenxin/, '')
                    },
                    '^/authserver(.*)': {
                        target: env.VITE_SCHOOL_LOGIN_URL,
                        changeOrigin: true,  // 修改请求头中的origin为目标服务器
                        secure: false,  // 如果是 HTTPS 接口，但不想检查 SSL 证书时设置为 false
                        rewrite: (path) => path.replace(/^\/authserver/, 'authserver')
                    },
                },
            },
        }
    }
)
