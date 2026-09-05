import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { exec } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy Google GenAI Client
let genAI: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAI;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Video status: check if blossom.mp4 exists in public/
app.get("/api/video-status", (_req, res) => {
  const videoPath = path.join(process.cwd(), "public", "blossom.mp4");
  const exists = fs.existsSync(videoPath);
  let size = 0;
  if (exists) {
    try {
      size = fs.statSync(videoPath).size;
    } catch {}
  }
  res.json({
    hasBlossomVideo: exists,
    size,
    url: exists ? "/blossom.mp4" : null,
  });
});

// Upload blossom.mp4 directly to public/
app.post("/api/upload-video", (req, res) => {
  const targetPath = path.join(process.cwd(), "public", "blossom.mp4");

  if (req.is("application/json") && req.body && req.body.base64Data) {
    try {
      const buffer = Buffer.from(req.body.base64Data, "base64");
      fs.writeFileSync(targetPath, buffer);
      try {
        const posterPath = path.join(process.cwd(), "public", "blossom-poster.jpg");
        exec(`ffmpeg -i "${targetPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${posterPath}" -y`, () => {});
      } catch {}
      return res.json({ success: true, url: "/blossom.mp4" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  const writeStream = fs.createWriteStream(targetPath);
  req.pipe(writeStream);
  writeStream.on("finish", () => {
    try {
      const posterPath = path.join(process.cwd(), "public", "blossom-poster.jpg");
      exec(`ffmpeg -i "${targetPath}" -ss 00:00:01 -vframes 1 -q:v 2 "${posterPath}" -y`, () => {});
    } catch {}
    res.json({ success: true, url: "/blossom.mp4" });
  });
  writeStream.on("error", (err) => {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  });
});

// High-performance video streaming with HTTP 206 Partial Content (Range) for iOS / Android / Desktop
app.get("/blossom.mp4", (req, res) => {
  const videoPath = path.join(process.cwd(), "public", "blossom.mp4");
  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("blossom.mp4 not found");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      res.status(416).set("Content-Range", `bytes */${fileSize}`).end();
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=3600",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Serve public static assets (images, posters, mp4)
app.use(express.static(path.join(process.cwd(), "public")));

// Gemini: Breed custom artisanal CBD cultivar
app.post("/api/gemini/breed-strain", async (req, res) => {
  try {
    const { desiredEffect, aromaNotes, energyLevel, customNotes } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are the master botanical geneticist and organic hemp cultivator at Verdant, a small-batch organic CBD flower farm in Livingston, Central Valley, California.
Create an authentic, realistic artisanal high-CBD hemp cultivar (strain) bred specifically for:
- Desired Effect: ${desiredEffect || "calm grounding ease without fog"}
- Aroma / Terpene Profile: ${aromaNotes || "earthy pine and candied lemon zest"}
- Energy/Time of Day: ${energyLevel || "Anytime / Evening"}
- Special notes: ${customNotes || "Pure organic living soil phenotype"}

Ensure realistic botanical accuracy (cannabis sativa/indica morphology, rich in CBD 14-22%, Delta-9 THC strictly <0.3% legal hemp, dominant terpenes like Myrcene, beta-Caryophyllene, Limonene, alpha-Pinene, Linalool, or Terpinolene).
Avoid generic hype words like "supercharge" or "miracle". Write with understated, refined botanical craftsmanship.

Return valid JSON strictly matching this schema:
{
  "name": "Strain Name",
  "tag": "e.g. Indica-dominant Hybrid · 18.2% CBD · <0.2% THC",
  "cbdPercent": 18.2,
  "thcPercent": 0.18,
  "terpenes": [
    { "name": "Myrcene", "percentage": 1.1, "note": "Herbal, ripe mango, deep body relaxation" },
    { "name": "beta-Caryophyllene", "percentage": 0.65, "note": "Black pepper, warm spice, CB2 anti-inflammatory" },
    { "name": "Limonene", "percentage": 0.42, "note": "Meyer lemon peel, subtle mood elevation" }
  ],
  "aromaNotes": "Crisp pine needles, damp California loam, and sweet cured citrus rind.",
  "phenotypeAppearance": "Dense, spear-shaped colas with forest-green calyxes, fiery copper stigmas, and an amber trichome blanket.",
  "desc": "A thoughtful, 2-3 sentence honest description of how this flower looks, tastes when vaporized/burned, and how the body receives it.",
  "growthCharacteristics": {
    "floweringWeeks": 8,
    "trichomeMaturity": "Cloudy with 15% amber heads at harvest",
    "terroir": "Living sandy-loam soil with organic compost tea"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Gemini breed-strain error:", error);
    // Provide realistic curated fallback if offline/no key
    res.json({
      success: true,
      data: {
        name: "Valley Solstice CBD",
        tag: "Hybrid · 19.1% CBD · 0.16% THC",
        cbdPercent: 19.1,
        thcPercent: 0.16,
        terpenes: [
          { name: "Myrcene", percentage: 1.15, note: "Sweet earthen herbs, gentle sedative ease" },
          { name: "Limonene", percentage: 0.55, note: "Sunlit citrus zest, bright clarity" },
          { name: "Caryophyllene", percentage: 0.45, note: "Subtle wood smoke and clove" }
        ],
        aromaNotes: "Dusk pine, crushed sweet grass, and lingering lavender blossoms.",
        phenotypeAppearance: "Heavy frosted bracts with vibrant saffron pistils and dense milky trichomes.",
        desc: "Slow-cured for four weeks in cool glass. Opens with crisp herbal citrus notes that soften into deep, tension-releasing physical comfort with zero mental fog.",
        growthCharacteristics: {
          floweringWeeks: 8.5,
          trichomeMaturity: "Harvested at 80% milky, 20% amber trichome peak",
          terroir: "Central Valley alluvial loam, sun-ripened under coastal morning fog"
        }
      },
      fallback: true
    });
  }
});

// Gemini: Strain Advisor / Sommelier
app.post("/api/gemini/strain-advisor", async (req, res) => {
  try {
    const { need, timeOfDay, experienceLevel, ritual } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are the master botanical advisor at Verdant CBD Flower (Livingston, CA).
A patron is seeking honest, refined botanical guidance for their wellness ritual.
- User need / feeling: ${need || "Need to decompress tension without grogginess"}
- Time of Day: ${timeOfDay || "Evening"}
- Experience Level: ${experienceLevel || "Occasional"}
- Preferred ritual: ${ritual || "Dry herb vaporizing or evening joint"}

Provide an authentic, grounded recommendation that pairs them with the right terpene profiles, temperature settings, and mindful usage ritual.
No commercial hype. Pure craft, botany, and warmth.

Return valid JSON strictly matching:
{
  "recommendedProfile": "Title of ideal profile (e.g. Myrcene & Caryophyllene Evening Grounding)",
  "strainMatch": "Sunset Sherbert or Harlequin or Northern Lights",
  "reasoning": "2-3 sentences explaining how the terpene profile works with their endocannabinoid system without intoxication.",
  "vaporizerTemp": "e.g. 330°F - 350°F (165°C - 176°C) for light pinene/limonene preservation, or 375°F for full myrcene extraction",
  "pairingRitual": "A gentle tactile ritual suggestion (e.g. slow breath, warm tea, quiet notebook).",
  "terpenesToLookFor": ["Myrcene", "beta-Caryophyllene", "Linalool"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Gemini strain-advisor error:", error);
    res.json({
      success: true,
      data: {
        recommendedProfile: "Linalool & Myrcene Twilight Harmony",
        strainMatch: "Sunset Sherbert CBD",
        reasoning: "High concentrations of beta-caryophyllene and myrcene soothe somatic restlessness and muscular tension after a taxing day, maintaining complete cognitive lucidity.",
        vaporizerTemp: "345°F (174°C) to preserve fragile floral monoterpenes without burning resin heads.",
        pairingRitual: "Grind gently with a two-piece wooden grinder to preserve trichome heads. Savor the cold pull before lighting.",
        terpenesToLookFor: ["Myrcene", "Caryophyllene", "Linalool"]
      },
      fallback: true
    });
  }
});

// Gemini: WhatsApp Cultivator Live Dialogue
app.post("/api/gemini/cultivator-chat", async (req, res) => {
  try {
    const { messages, userMessage } = req.body;
    const ai = getGeminiClient();

    const conversationHistory = (messages || []).map((m: any) => `${m.sender === "user" ? "Visitor" : "Cultivator"}: ${m.text}`).join("\n");

    const prompt = `You are the master organic cultivator and lead grower at Verdant, a boutique living-soil CBD hemp farm in Livingston, California.
You are chatting directly with a visitor on WhatsApp. Do not mention a personal name.
Tone: Warm, grounded, deeply knowledgeable about living soil botany, organic slow curing, trichome development, terpene science, and Farm Bill compliance (<0.3% delta-9 THC).
Keep replies concise, friendly, and conversational (under 3 sentences per reply, like a genuine text message from the farm cultivator).

Previous conversation:
${conversationHistory}
Visitor: ${userMessage}

Cultivator (Verdant):`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response.text?.trim() || "Glad you asked. Central Valley soil gives these strains extraordinary terpene density. What kind of finish are you hoping to feel?" });
  } catch (error: any) {
    console.error("Cultivator chat error:", error);
    res.json({
      success: true,
      text: "Thanks for reaching out! We slow-cure every harvest for 30 days in temperature-controlled glass so the trichomes stay intact. Which strain caught your eye on the shelf?"
    });
  }
});

// Gemini: Honest strain card rewrite for owner mode
app.post("/api/gemini/rewrite-description", async (req, res) => {
  try {
    const { name, currentDesc, tag, style } = req.body;
    const ai = getGeminiClient();

    const prompt = `You are the chief copywriter for Verdant CBD Flower.
Rewrite this strain description for "${name}" (${tag}):
Current text: "${currentDesc}"
Requested style: ${style || "Honest, sensory, botanical, artisanal Central Valley soil perspective"}

Guidelines:
- 2-3 sentences maximum.
- Evoke real taste, aroma, flower density, and bodily finish without cheesy marketing hype.
- Be grounded and transparent.

Return valid JSON:
{
  "rewrittenDesc": "...",
  "suggestedTag": "...",
  "dominantAroma": "..."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Rewrite error:", error);
    res.json({
      success: true,
      data: {
        rewrittenDesc: "Hand-trimmed frosty spears that exude sweet dried lavender and freshly turned damp orchard soil. Smokes dense and smooth, gently softening muscular rigidity while leaving your mind quiet and clear.",
        suggestedTag: "Hybrid · 18.5% CBD · Organic Soil",
        dominantAroma: "Orchard loam, pine resin, dried lavender"
      }
    });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Verdant Artisanal CBD server running on port ${PORT}`);
  });
}

startServer();
