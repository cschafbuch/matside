/**
 * Daily wrestling news scraper
 * Fetches from FloWrestling RSS + WrestleStat, writes to Supabase news_items,
 * then triggers the AI Edge Function to regenerate insights.
 *
 * Runs via GitHub Actions cron — see .github/workflows/daily-scrape.yml
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_FUNCTION_URL = process.env.SUPABASE_FUNCTION_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Keywords that flag a news item as injury/withdrawal related
const INJURY_KEYWORDS = [
  "injured", "injury", "withdraw", "withdrawal", "forfeits", "medical",
  "scratched", "DNS", "did not start", "out for", "season-ending",
  "transfer", "redshirt",
];

// Weight class patterns for tagging articles
const WC_PATTERNS = [
  [125, /\b125\b/], [133, /\b133\b/], [141, /\b141\b/], [149, /\b149\b/],
  [157, /\b157\b/], [165, /\b165\b/], [174, /\b174\b/], [184, /\b184\b/],
  [197, /\b197\b/], [285, /\b285\b|\bheavyweight\b/i],
];

// Known wrestler names for tagging articles
const WRESTLERS = [
  "Vincent Robinson","Luke Lilledahl","Jesse Mendez","Levi Haines","Rocco Welsh",
  "Mitchell Mesenbrink","Yonger Bastida","Lucas Byrd","Shayne Van Ness","Peyton Robb",
  "Mikey Caliendo","Patrick Kennedy","Rocky Elam","Brock Hardy","Sergio Vega",
  "Nic Bouzakis","Drake Ayala","Evan Frost","Joey Olivieri","Jax Forrest",
];

function detectWc(text) {
  for (const [wc, pattern] of WC_PATTERNS) {
    if (pattern.test(text)) return wc;
  }
  return null;
}

function detectWrestler(text) {
  return WRESTLERS.find(name => text.includes(name)) || null;
}

function isInjuryAlert(text) {
  const lower = text.toLowerCase();
  return INJURY_KEYWORDS.some(kw => lower.includes(kw));
}

async function fetchFloWrestlingRSS() {
  const items = [];
  try {
    // FloWrestling doesn't have a public RSS, so we fetch their news page
    // and parse basic article titles. In production, use a proper scraping
    // service or subscribe to their API.
    const res = await fetch("https://www.flowrestling.org/articles", {
      headers: { "User-Agent": "MatSide-Bot/1.0 (wrestling analytics)" },
    });
    if (!res.ok) throw new Error(`FloWrestling fetch failed: ${res.status}`);
    const html = await res.text();

    // Extract article titles from the page (adjust selector patterns as needed)
    const titleMatches = html.matchAll(/<h\d[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h\d>/gi);
    for (const match of titleMatches) {
      const title = match[1].trim();
      if (title.length > 10) {
        items.push({
          title,
          source: "FloWrestling",
          url: "https://www.flowrestling.org/articles",
          content: title,
          is_injury_alert: isInjuryAlert(title),
          weight_class: detectWc(title),
          wrestler_name: detectWrestler(title),
        });
      }
    }
  } catch (err) {
    console.warn("FloWrestling scrape warning:", err.message);
  }
  return items;
}

async function fetchInterMatRSS() {
  const items = [];
  try {
    const res = await fetch("https://intermat.com/feed/", {
      headers: { "User-Agent": "MatSide-Bot/1.0" },
    });
    if (!res.ok) throw new Error(`InterMat RSS failed: ${res.status}`);
    const xml = await res.text();

    const entries = xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[([^\]]+)\]\]><\/title>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<\/item>/g);
    for (const match of entries) {
      const title = match[1].trim();
      const url = match[2].trim();
      items.push({
        title,
        source: "InterMat",
        url,
        content: title,
        is_injury_alert: isInjuryAlert(title),
        weight_class: detectWc(title),
        wrestler_name: detectWrestler(title),
      });
    }
  } catch (err) {
    console.warn("InterMat RSS warning:", err.message);
  }
  return items;
}

async function main() {
  console.log("Starting daily scrape:", new Date().toISOString());

  const [floItems, intermatItems] = await Promise.all([
    fetchFloWrestlingRSS(),
    fetchInterMatRSS(),
  ]);

  const allItems = [...floItems, ...intermatItems];
  console.log(`Scraped ${allItems.length} items (${floItems.length} Flo, ${intermatItems.length} InterMat)`);

  if (allItems.length > 0) {
    const { error } = await supabase.from("news_items").insert(allItems);
    if (error) {
      console.error("Failed to insert news items:", error.message);
    } else {
      console.log(`Inserted ${allItems.length} news items into Supabase`);
    }
  }

  // Trigger AI Edge Function to regenerate insights
  if (SUPABASE_FUNCTION_URL) {
    try {
      const res = await fetch(SUPABASE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trigger: "daily-scrape" }),
      });
      const result = await res.json();
      console.log("AI insights generated:", result);
    } catch (err) {
      console.error("Failed to trigger AI function:", err.message);
    }
  } else {
    console.warn("SUPABASE_FUNCTION_URL not set — skipping AI insights generation");
  }

  console.log("Scrape complete:", new Date().toISOString());
}

main().catch(err => {
  console.error("Fatal scrape error:", err);
  process.exit(1);
});
