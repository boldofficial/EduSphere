import { NextRequest, NextResponse } from "next/server";

function getAlocBaseUrl(): string {
    return process.env.NEXT_PUBLIC_ALOC_API_URL || "https://questions.aloc.com.ng/api/v2";
}

export async function GET(request: NextRequest) {
    const token = process.env.NEXT_PUBLIC_ALOC_API_TOKEN;
    if (!token) {
        return NextResponse.json({ error: "ALOC API token is not configured on server." }, { status: 500 });
    }

    const subject = request.nextUrl.searchParams.get("subject") || "";
    const examTypeInput = (request.nextUrl.searchParams.get("exam_type") || "wassce").toLowerCase();
    const year = request.nextUrl.searchParams.get("year") || "";
    const count = request.nextUrl.searchParams.get("count") || "10";

    const examTypeMap: Record<string, string> = {
        wassce: "waec",
        waec: "waec",
        utme: "jamb",
        jamb: "jamb",
        neco: "neco",
        post_utme: "post-utme",
        internal: "internal",
    };
    const examType = examTypeMap[examTypeInput] || examTypeInput;

    const upstreamUrl = `${getAlocBaseUrl()}/m?subject=${encodeURIComponent(subject.toLowerCase())}&type=${encodeURIComponent(examType)}&year=${encodeURIComponent(year)}&limit=${encodeURIComponent(count)}`;

    try {
        const upstreamRes = await fetch(upstreamUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                access_token: token,
                AccessToken: token,
                "x-access-token": token,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        const raw = await upstreamRes.text();
        let data: any = {};
        try {
            data = JSON.parse(raw);
        } catch {
            data = { raw };
        }

        if (!upstreamRes.ok) {
            return NextResponse.json(
                {
                    error: data?.message || data?.error || `ALOC API request failed with ${upstreamRes.status}`,
                    status: upstreamRes.status,
                    details: data,
                },
                { status: 502 }
            );
        }

        const questions = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : [];
        return NextResponse.json({ questions });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to reach ALOC API", details: (error as Error).message },
            { status: 502 }
        );
    }
}
