// Vercel serverless function for global baby-reveal votes.
// Configure COUNTER_WORKSPACE and COUNTER_API_TOKEN in Vercel Project Settings.
// The token stays on the server and is never sent to the browser.

const COUNTER_API_BASE = "https://api.counterapi.dev/v2";
const COUNTERS = {
  boy: "baby-boy-votes",
  girl: "baby-girl-votes",
};

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function getCount(payload) {
  const data = payload?.data ?? payload;
  const values = [
    data?.up_count,
    data?.count,
    data?.value,
    data?.counter?.up_count,
    data?.counter?.count,
  ];
  return values.find((v) => typeof v === "number" && Number.isFinite(v)) ?? null;
}

async function counterRequest(counterName, action = "") {
  const workspace = process.env.COUNTER_WORKSPACE;
  const token = process.env.COUNTER_API_TOKEN;
  if (!workspace || !token) {
    const error = new Error("Server configuration missing: set COUNTER_WORKSPACE and COUNTER_API_TOKEN in Vercel.");
    error.status = 500;
    throw error;
  }

  const url = `${COUNTER_API_BASE}/${encodeURIComponent(workspace)}/${encodeURIComponent(counterName)}${action}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `CounterAPI returned ${response.status}`);
    error.status = 502;
    throw error;
  }
  return payload;
}

async function readCount(key) {
  const payload = await counterRequest(COUNTERS[key]);
  const count = getCount(payload);
  if (count === null) throw new Error(`CounterAPI response for ${key} did not contain a readable count.`);
  return count;
}

async function readTotals() {
  const [boy, girl] = await Promise.all([readCount("boy"), readCount("girl")]);
  return { boy, girl };
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      return json(res, 200, await readTotals());
    } catch (error) {
      console.error("Unable to read CounterAPI totals:", error.message);
      return json(res, error.status || 502, { error: "Unable to load global vote totals. Check the CounterAPI workspace, token, and counter setup." });
    }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  }

  const choice = req.body?.choice;
  if (choice !== "boy" && choice !== "girl") {
    return json(res, 400, { error: 'choice must be "boy" or "girl".' });
  }

  try {
    // Increment only the selected counter, then return the latest shared totals.
    await counterRequest(COUNTERS[choice], "/up");
    return json(res, 200, await readTotals());
  } catch (error) {
    console.error("Unable to record vote:", error.message);
    return json(res, error.status || 502, { error: "Unable to record your vote. Please try again." });
  }
};
