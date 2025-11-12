import { useState } from "react";

export default function AIPanel() {
  const [datasetId, setDatasetId] = useState("");
  const [metricId, setMetricId] = useState("");
  const [ts, setTs] = useState("");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");

  async function suggestRules(e) {
    e.preventDefault();
    const res = await fetch(`/ai/suggest_rules?dataset_id=${datasetId}`);
    const data = await res.json().catch(()=>({}));
    setOut(JSON.stringify(data, null, 2));
  }

  async function explainAnomaly(e) {
    e.preventDefault();
    const res = await fetch(`/ai/explain_anomaly?metric_id=${metricId}&ts=${encodeURIComponent(ts)}`);
    const data = await res.json().catch(()=>({}));
    setOut(JSON.stringify(data, null, 2));
  }

  async function generateMetric(e) {
    e.preventDefault();
    const res = await fetch(`/ai/generate_metric_from_prompt?dataset_id=${datasetId}&prompt_str=${encodeURIComponent(prompt)}`);
    const data = await res.json().catch(()=>({}));
    setOut(JSON.stringify(data, null, 2));
  }

  return (
    <div style={{marginTop: 24, padding: 12, border: "1px solid #ddd", borderRadius: 8}}>
      <h3>AI Assist</h3>

      <div style={{display:"grid", gap:12, gridTemplateColumns:"1fr"}}>
        <form onSubmit={suggestRules} style={{display:"flex", gap:8, alignItems:"center"}}>
          <input value={datasetId} onChange={e=>setDatasetId(e.target.value)} placeholder="Dataset ID" required />
          <button>Suggest DQ rules</button>
        </form>

        <form onSubmit={explainAnomaly} style={{display:"flex", gap:8, alignItems:"center"}}>
          <input value={metricId} onChange={e=>setMetricId(e.target.value)} placeholder="Metric ID" required />
          <input value={ts} onChange={e=>setTs(e.target.value)} placeholder="Anomaly timestamp (ISO)" required />
          <button>Explain anomaly</button>
        </form>

        <form onSubmit={generateMetric} style={{display:"flex", gap:8, alignItems:"center"}}>
          <input value={datasetId} onChange={e=>setDatasetId(e.target.value)} placeholder="Dataset ID" required />
          <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder='e.g. "daily revenue over time"' required />
          <button>Generate metric from prompt</button>
        </form>
      </div>

      <pre style={{textAlign:"left", marginTop:12, whiteSpace:"pre-wrap"}}>{out}</pre>
    </div>
  );
}
