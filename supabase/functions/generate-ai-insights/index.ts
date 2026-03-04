import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WRESTLERS_BY_WC: Record<number, string[]> = {
  125: ["Vincent Robinson","Luke Lilledahl","Nic Bouzakis","Eddie Ventresca","Sheldon Seymour","Dean Peterson","Troy Spratley","Jett Strickenberger","Jore Volk","Maximo Renteria"],
  133: ["Lucas Byrd","Ben Davino","Evan Frost","Drake Ayala","Marcus Blaze","Kyler Larkin","Tyler Knox","Jacob Van Dee","Dominick Serrano","Evan Mougalian"],
  141: ["Jesse Mendez","Sergio Vega","Brock Hardy","Anthony Echemendia","Joey Olivieri","Aaron Nagao","Caden Sherrill","Cael Hughes","Killian Cardinale","Dylan Gilcher"],
  149: ["Shayne Van Ness","Meyer Shapiro","Caleb Henson","Wyatt Henson","Lachlan McNeil","Parker Filius","Jore Volk","Clay Lautt","Jagger Conners","Tanner Sloan"],
  157: ["Peyton Robb","Hayden Copass","Tyler Eischens","Garrett Model","Danny Braunagel","Will Lewan","Cason Leistner","Logan Breitenbach","Sam Wolf","Luke Stout"],
  165: ["Mitchell Mesenbrink","Mikey Caliendo","Ladarion Lockett","Joey Blaze","Nick Smith","Hunter Ritter","Markus Hartman","Braxton Amos","Brit Wilson","Sammy Sasso"],
  174: ["Levi Haines","Simon Ruiz","Patrick Kennedy","Alex Facundo","Jared Franek","Carter Bailey","Caleb Henson","Cameron Amine","Michael Beard","Ryan Jack"],
  184: ["Rocco Welsh","Angelo Ferrari","Gavin Kane","Roper Jones","Bernie Truax","Kyle Mosher","Tanner Harvey","Josh Barr","Michael Beard","Wyatt Henson"],
  197: ["Josh Barr","Rocky Elam","Cody Merrill","Isaiah Salazar","Marcus Coleman","Nino Bonaccorsi","Tanner Harvey","Hunter Ritter","Jake Lcharleston","Michael Beard"],
  285: ["Yonger Bastida","Nick Felman","Konner Doucet","Lucas Davison","Mason Parris","Trent Hilger","Jax Forrest","Aden Attao","Wyatt Vogt","Michael Elam"],
};

serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch last 48h of news
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const { data: news } = await supabase
    .from("news_items")
    .select("*")
    .gte("scraped_at", cutoff)
    .order("scraped_at", { ascending: false })
    .limit(50);

  const newsContext = news && news.length > 0
    ? news.map((n: { title: string; source: string; content: string; is_injury_alert: boolean }) =>
        `[${n.source}] ${n.title}${n.is_injury_alert ? " [INJURY ALERT]" : ""}: ${n.content?.slice(0, 200) ?? ""}`
      ).join("\n")
    : "No recent news available.";

  const rankingsContext = Object.entries(WRESTLERS_BY_WC)
    .map(([wc, wrestlers]) => `${wc} lbs: ${wrestlers.map((n, i) => `#${i + 1} ${n}`).join(", ")}`)
    .join("\n");

  const prompt = `You are an expert NCAA Division I wrestling analyst with deep knowledge of 2025-26 season results, rankings, and trends. Analyze the following data and generate confidence predictions for key wrestlers.

CURRENT RANKINGS (InterMat Week 17, Feb 2026):
${rankingsContext}

RECENT NEWS (last 48 hours):
${newsContext}

Generate a JSON response with this exact structure — no markdown, no explanation, just valid JSON:
{
  "insights": [
    {
      "weight_class": 125,
      "wrestlers": [
        {
          "name": "Vincent Robinson",
          "confidence_score": 82,
          "confidence_label": "HIGH",
          "upset_risk": "LOW",
          "injury_alert": false,
          "injury_note": null,
          "insight_text": "Robinson's dominance at NC State this season gives him clear path to the title."
        }
      ]
    }
  ]
}

Rules:
- Include all 10 weight classes (125, 133, 141, 149, 157, 165, 174, 184, 197, 285)
- For each weight class, include the top 3 ranked wrestlers
- confidence_score: 0-100 (top ranked wrestlers typically 65-90)
- confidence_label: LOW (<50), MEDIUM (50-70), HIGH (>70)
- upset_risk: LOW, MEDIUM, or HIGH based on competitive closeness
- Set injury_alert true if news mentions injury/withdrawal for that wrestler
- insight_text: 1 sentence analysis (max 120 chars)
- Base predictions on ranking strength, recent results, and any injury news`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: "Claude API failed", status: response.status }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const claudeData = await response.json();
  const rawText = claudeData.content[0].text.trim();

  let parsed: { insights: Array<{ weight_class: number; wrestlers: Array<{ name: string; confidence_score: number; confidence_label: string; upset_risk: string; injury_alert: boolean; injury_note: string | null; insight_text: string }> }> };
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return new Response(JSON.stringify({ error: "Failed to parse Claude response", raw: rawText }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Upsert insights — delete old ones first, then insert fresh
  const rows = parsed.insights.flatMap(wc =>
    wc.wrestlers.map(w => ({
      weight_class: wc.weight_class,
      wrestler_name: w.name,
      confidence_score: w.confidence_score,
      confidence_label: w.confidence_label,
      upset_risk: w.upset_risk,
      injury_alert: w.injury_alert,
      injury_note: w.injury_note,
      insight_text: w.insight_text,
      generated_at: new Date().toISOString(),
    }))
  );

  // Delete previous insights and replace with fresh ones
  await supabase.from("ai_insights").delete().lt("generated_at", new Date(Date.now() - 60000).toISOString());
  const { error: insertError } = await supabase.from("ai_insights").insert(rows);

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, count: rows.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
