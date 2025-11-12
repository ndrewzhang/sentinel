// frontend/src/components/AIAssist.jsx
import { useState } from "react";

export default function AIAssist() {
  const [dsId, setDsId] = useState("");
  const [metricId, setMetricId] = useState("");
  const [index, setIndex] = useState("");
  const [genPrompt, setGenPrompt] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  // --- helper: safe parse JSON ---
  function tryParseJSON(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  // --- SUGGEST DQ RULES ---
  async function getSuggestRules() {
  setLoading(true); setOut("Working…");
  try {
    const res = await fetch(`/ai/suggest_rules?dataset_id=${encodeURIComponent(dsId)}`);
    const data = await res.json();
    if (data.rules && Array.isArray(data.rules)) {
      setOut(JSON.stringify(data, null, 2));
    } else if (data.rules_text) {
      setOut(data.rules_text); // show plain text fallback
    } else if (data.detail) {
      setOut(`❌ ${data.detail}`);
    } else {
      setOut(JSON.stringify(data, null, 2)); // last resort
    }
  } catch (e) {
    setOut(`❌ ${e}`);
  } finally {
    setLoading(false);
  }
}


  // --- EXPLAIN ANOMALY ---
  async function getExplainAnomaly() {
    if (!metricId || !index)
      return setOut("⚠️ Enter both Metric ID and Index.");
    setLoading(true);
    setOut("Loading...");

    try {
      const params = new URLSearchParams({
        metric_id: String(metricId),
        index: String(index),
      });
      const res = await fetch(`/ai/explain_anomaly?${params.toString()}`);
      const body = await res.text();

      if (!res.ok) {
        setOut(`❌ HTTP ${res.status}\n${body}`);
        return;
      }

      const parsed = tryParseJSON(body);
      setOut(parsed ? JSON.stringify(parsed, null, 2) : body || "(empty)");
    } catch (e) {
      setOut(`❌ ${e}`);
    } finally {
      setLoading(false);
    }
  }

  // --- GENERATE METRIC ---
  async function postGenerateMetric() {
    if (!dsId || !genPrompt)
      return setOut("⚠️ Enter a dataset ID and prompt.");
    setLoading(true);
    setOut("Loading...");

    try {
      const res = await fetch(`/ai/generate_metric`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: Number(dsId),
          prompt: genPrompt,
        }),
      });

      const body = await res.text();
      if (!res.ok) {
        setOut(`❌ HTTP ${res.status}\n${body}`);
        return;
      }

      const parsed = tryParseJSON(body);
      setOut(parsed ? JSON.stringify(parsed, null, 2) : body || "(empty)");
    } catch (e) {
      setOut(`❌ ${e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: 8,
        padding: 16,
        marginTop: 24,
      }}
    >
      <h3 style={{ marginBottom: 12 }}>AI Assist</h3>

      <div style={{ display: "grid", gap: 14 }}>
        {/* Suggest Rules */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Suggest DQ rules</div>
          <input
            value={dsId}
            onChange={(e) => setDsId(e.target.value)}
            placeholder="Dataset ID"
            style={{ width: 100 }}
          />
          <button
            onClick={getSuggestRules}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            Suggest
          </button>
        </div>

        {/* Explain Anomaly */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Explain anomaly</div>
          <input
            value={metricId}
            onChange={(e) => setMetricId(e.target.value)}
            placeholder="Metric ID"
            style={{ width: 100 }}
          />
          <input
            value={index}
            onChange={(e) => setIndex(e.target.value)}
            placeholder="Point index (0-based)"
            style={{ marginLeft: 8, width: 160 }}
          />
          <button
            onClick={getExplainAnomaly}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            Explain
          </button>
        </div>

        {/* Generate Metric */}
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Generate metric from prompt
          </div>
          <input
            value={dsId}
            onChange={(e) => setDsId(e.target.value)}
            placeholder="Dataset ID"
            style={{ width: 100 }}
          />
          <input
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
            placeholder='e.g. "daily revenue over time"'
            style={{ marginLeft: 8, width: 360 }}
          />
          <button
            onClick={postGenerateMetric}
            disabled={loading}
            style={{ marginLeft: 8 }}
          >
            Generate
          </button>
        </div>
      </div>

      <pre
        style={{
          marginTop: 12,
          background: "#0b1020",
          color: "#d9f99d",
          padding: 8,
          borderRadius: 6,
          overflowX: "auto",
          minHeight: 100,
        }}
      >
        {out || (loading ? "Working…" : "")}
      </pre>
    </div>
  );
}
