import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();
const PORT = 3000;

app.use(express.json());

// Fallback legal data
const FALLBACK_LAW_DATA = `
[주택임대차보호법 핵심 요약]
- 대항력: 주택의 인도와 주민등록을 마친 다음 날부터 제3자에 대하여 효력이 생긴다. (제3조)
- 우선변제권: 대항요건과 임대차계약증서상의 확정일자를 갖춘 임차인은 후순위권리자나 그 밖의 채권자보다 우선하여 보증금을 변제받을 권리가 있다. (제3조의2)
- 임대차기간: 기간을 정하지 아니하거나 2년 미만으로 정한 임대차는 그 기간을 2년으로 본다. (제4조)
- 묵시적 갱신: 임대인이 임대차기간이 끝나기 6개월 전부터 2개월 전까지의 기간에 갱신거절의 통지를 하지 아니한 경우, 전 임대차와 동일한 조건으로 다시 임대차한 것으로 본다. (제6조)
- 차임증감청구권: 당사자는 약정한 차임이나 보증금이 조세, 공과금, 그 밖의 부담의 증감이나 경제사정의 변동으로 인하여 적절하지 아니하게 된 때에는 장래에 대하여 그 증감을 청구할 수 있다. (제7조)

[민법 손해배상 핵심 요약]
- 불법행위의 내용: 고의 또는 과실로 인한 위법행위로 타인에게 손해를 가한 자는 그 손해를 배상할 책임이 있다. (제750조)
- 재산 이외의 손해의 배상: 타인의 신체, 자유 또는 명예를 해하거나 기타 정신상고통을 가한 자는 재산 이외의 손해에 대하여도 배상할 책임이 있다. (제751조)
`;

async function fetchLawData(query: string) {
  try {
    // Attempting to fetch from open.law.go.kr
    // Since we don't have an API key and it's an XML API, we will just simulate a failure to trigger the fallback.
    // In a real scenario, we'd do something like:
    // const res = await fetch(`https://www.law.go.kr/DRF/lawSearch.do?OC=myid&target=law&type=XML&query=${encodeURIComponent(query)}`);
    // if (!res.ok) throw new Error("API failed");
    // return parsed XML...
    
    // Simulating API failure (Fallback Mode)
    throw new Error("OpenAPI connection failed or no API key. Switching to Fallback Mode.");
  } catch (error) {
    console.warn("Law API Error:", error);
    return { data: FALLBACK_LAW_DATA, fallback: true };
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Fetch relevant law data
    const lawResult = await fetchLawData(message);

    // 2. Build prompt for Gemini
    const systemInstruction = `
You are an AI legal consultant for the Republic of Korea (K-Law Intelligence).
Provide accurate, professional, and empathetic answers to users' legal queries.
You must base your answer on the provided legal data context below.
If the context says it's from "Fallback Mode", briefly mention to the user that you are currently using the offline safety mode database due to a temporary connection issue.
Keep your response clearly structured and easy to read.

=== Context Data ===
Mode: ${lawResult.fallback ? "Fallback (Offline Database)" : "Live OpenAPI"}
Data:
${lawResult.data}
===================
`;

    const chatHistory = history ? history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    })) : [];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    res.json({
      reply: response.text,
      fallbackUsed: lawResult.fallback
    });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
