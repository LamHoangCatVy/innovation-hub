import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body;

    const apiKey = process.env.DEEPSEEK_API_KEY || "";
    const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
    const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

    if (!apiKey || apiKey === "your-deepseek-api-key-here") {
      return NextResponse.json({
        reply: "YumAI chua duoc ket noi API key. Ban hay them DEEPSEEK_API_KEY vao .env nhe!",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(proxy ? { "X-Forwarded-For": "127.0.0.1" } : {}),
        },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
          messages: [
            {
              role: "system",
              content: "Ban la YumAI - tro ly AI de thuong cua To Cong tac DMST. Tra loi ngan gon, than thien bang tieng Viet. Dung emoji nhe nhang. Xung 'minh', goi nguoi dung la 'ban'.",
            },
            ...(messages || []),
          ],
          stream: false,
        }),
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const err = await res.text();
        console.error("DeepSeek status:", res.status, err.slice(0, 200));
        return NextResponse.json({
          reply: "YumAI dang hoi ban, ban thu lai sau vai giay nhe!",
        });
      }

      const data = await res.json();
      return NextResponse.json({
        reply: data.choices?.[0]?.message?.content || "YumAI chua kip nghi ra... ban hoi lai nhe!",
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("DeepSeek connect error:", (fetchErr as Error).message);

      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        return NextResponse.json({
          reply: "YumAI cho hoi lau ma khong thay phan hoi. Co ve server AI hoi ban, ban thu lai sau nhe!",
        });
      }

      return NextResponse.json({
        reply: "YumAI chua ket noi duoc toi may chu AI. Co the mang cua ban dang chan? Thu dung VPN hoac lien he IT de mo port nhe.\n\nTrong luc cho, ban co the hoi minh cac cau co ban ve Innovation Hub!",
      });
    }
  } catch (e) {
    console.error("Chat route error:", e);
    return NextResponse.json({
      reply: "Co loi ky thuat roi. YumAI se quay lai ngay sau khi duoc sua xong!",
    });
  }
}
