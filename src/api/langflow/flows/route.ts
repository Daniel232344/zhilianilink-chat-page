import {NextRequest, NextResponse} from "next/server";
import {ApiPath, LANG_FLOW_BASE_URL, ServiceProvider} from "@/app/constant";
import {getServerSideConfig} from "@/app/config/server";
import axios from "axios";
import exp from "node:constants";

const serverConfig = getServerSideConfig();

async function handle(
    req: NextRequest,
    {params}: { params: { path: string[] } },
) {
    if (req.method == "GET") {
        return await request(req);
    }
}

async function request(req: NextRequest) {
    const controller = new AbortController();

    const path = "/store/components/all";

    let baseUrl = serverConfig.langflowJavaUrl || LANG_FLOW_BASE_URL;

    if (baseUrl.endsWith("/")) {
        baseUrl = baseUrl.slice(0, -1);
    }

    const timeoutId = setTimeout(
        () => {
            controller.abort();
        },
        10 * 60 * 1000,
    );

    const fetchUrl = `${baseUrl}${path}`;

    const headers = {
        Authorization: "Bearer " + serverConfig.langflowToken,
    }

    const fetchOptions: RequestInit = {
        headers: {
            Authorization: "Bearer " + serverConfig.langflowToken,
        },
        method: req.method,
        redirect: "manual",
        // @ts-ignore
        duplex: "half",
        signal: controller.signal,
        next: {revalidate: 1},
    };

    try {
        const res = await fetch(fetchUrl, fetchOptions);

        // to prevent browser prompt for credentials
        const newHeaders = new Headers(res.headers);
        newHeaders.delete("www-authenticate");
        // to disable nginx buffering
        newHeaders.set("X-Accel-Buffering", "no");

        return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: newHeaders,
        });
    } catch (e) {
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}

export const GET = handle;
