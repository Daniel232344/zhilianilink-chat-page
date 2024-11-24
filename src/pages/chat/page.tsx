import { Home } from "@/componets/chat/home";
import Auth from './auth.tsx';
export default function ChatPage() {
  return (
    <>
        <Auth>
            <Home />
        </Auth>
    </>
  );
}
