/*
 * @Author: 谢子健 1075010289@qq.com
 * @Date: 2024-08-26 21:46:59
 * @LastEditors: 谢子健 1075010289@qq.com
 * @LastEditTime: 2024-09-12 21:51:38
 * @FilePath: \zhilianilink\src\router\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/*
 * @Author: 谢子健 1075010289@qq.com
 * @Date: 2024-08-26 21:46:59
 * @LastEditors: 谢子健 1075010289@qq.com
 * @LastEditTime: 2024-09-12 15:44:09
 * @FilePath: \zhilianilink\src\router\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {Chat} from "@/componets/chat/chat.tsx";
import {NewChat} from "@/componets/chat/new-chat.tsx";
import ChatPage from "@/pages/chat/page.tsx";
import {createBrowserRouter} from "react-router-dom";

const router = createBrowserRouter([
        {
            path: '/chat/:flowId?',
            element: <ChatPage/>,
            children: [
                {
                    path: '',
                    element: <Chat/>
                },
                {
                    path: 'new-chat',
                    element: <NewChat/>
                }
            ]
        },
    ],
    {basename: import.meta.env.VITE_ROUTER_BASENAME}
)

export {router};
