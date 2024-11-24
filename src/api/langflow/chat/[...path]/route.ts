import {getServerSideConfig} from "@/app/config/server";
import {ApiPath, LANG_FLOW_BASE_URL, ServiceProvider} from "@/app/constant";
import {prettyObject} from "@/app/utils/format";
import {NextRequest, NextResponse} from "next/server";
import {isModelAvailableInServer} from "@/app/utils/model";
import {Exception} from "sass";

const serverConfig = getServerSideConfig();

async function handle(
    req: NextRequest,
    {params}: { params: { path: string[] } },
) {

    if (req.method === "OPTIONS") {
        return NextResponse.json({body: "OK"}, {status: 200});
    }

    try {
        return await request(req);
    } catch (e) {
        return NextResponse.json({error: true, message: e}, {status: 500});
    }
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
export const preferredRegion = [
    "arn1",
    "bom1",
    "cdg1",
    "cle1",
    "cpt1",
    "dub1",
    "fra1",
    "gru1",
    "hnd1",
    "iad1",
    "icn1",
    "kix1",
    "lhr1",
    "pdx1",
    "sfo1",
    "sin1",
    "syd1",
];

async function request(req: NextRequest) {
    const controller = new AbortController();

    const path = `${req.nextUrl.pathname}`.replaceAll(ApiPath.Langflow, "");

    let baseUrl = serverConfig.langflowPythonUrl || LANG_FLOW_BASE_URL;

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

    const fetchOptions: RequestInit = {
        headers: {
            "Content-Type": "application/json",
        },
        method: req.method,
        body: req.body,
        redirect: "manual",
        // @ts-ignore
        duplex: "half",
        signal: controller.signal,
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
        console.log("error", e.message)
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}
