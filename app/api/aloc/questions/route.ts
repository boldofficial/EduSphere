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

    try {
        const headers = {
            Authorization: `Bearer ${token}`,
            access_token: token,
            AccessToken: token,
            "x-access-token": token,
            "Content-Type": "application/json",
        };

        const base = getAlocBaseUrl();
        const subjectParam = encodeURIComponent(subject.toLowerCase());
        const typeParam = encodeURIComponent(examType);
        const yearParam = encodeURIComponent(year);
        const limitParam = encodeURIComponent(count);

        const candidates = [
            `${base}/m?subject=${subjectParam}&type=${typeParam}&year=${yearParam}&limit=${limitParam}`,
            `${base}/m?subject=${subjectParam}&type=${typeParam}&limit=${limitParam}`,
            `${base}/m?subject=${subjectParam}&limit=${limitParam}`,
            `${base}/q?subject=${subjectParam}&type=${typeParam}&year=${yearParam}`,
            `${base}/q?subject=${subjectParam}&type=${typeParam}`,
            `${base}/q?subject=${subjectParam}`,
        ];

        let lastError: any = null;
        for (const upstreamUrl of candidates) {
            const upstreamRes = await fetch(upstreamUrl, { method: "GET", headers, cache: "no-store" });
            const raw = await upstreamRes.text();
            let data: any = {};
            try {
                data = JSON.parse(raw);
            } catch {
                data = { raw };
            }

            if (!upstreamRes.ok) {
                lastError = {
                    error: data?.message || data?.error || `ALOC API request failed with ${upstreamRes.status}`,
                    status: upstreamRes.status,
                    details: data,
                    upstreamUrl,
                };
                continue;
            }

            const questions = Array.isArray(data)
                ? data
                : Array.isArray(data?.questions)
                    ? data.questions
                    : data && typeof data === "object" && (data.question || data.question_text)
                        ? [data]
                        : [];

            if (questions.length > 0) {
                return NextResponse.json({ questions, source: upstreamUrl });
            }
        }

        if (lastError) {
            return NextResponse.json(lastError, { status: 502 });
        }

        return NextResponse.json({ questions: [] });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to reach ALOC API", details: (error as Error).message },
            { status: 502 }
        );
    }
}
