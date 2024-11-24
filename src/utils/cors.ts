import { ApiPath, DEFAULT_API_HOST } from "@/pages/chat/constant";

export function corsPath(path: string) {
  const baseUrl = "";

  if (baseUrl === "" && path === "") {
    return "";
  }
  if (!path.startsWith("/")) {
    path = "/" + path;
  }

  if (!path.endsWith("/")) {
    path += "/";
  }

  return `${baseUrl}${path}`;
}
