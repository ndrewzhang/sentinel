import { useState } from "react";

export default function AnomalyOverlay({ metricId, onOverlay }) {
  const [win, setWin] = useState(24);
  const [thr, setThr] = useState(3);

  async function run(e) {
    e.preventDefault();
    const res = await fetch(`/anomalies/zscore?metric_id=${metricId}&window=${win}&threshold=${thr}`);
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Failed to compute anomalies");
      return;
    }
    // Pass anomalies back to parent to render on chart
    onOverlay?.(data.anomalies || []);
  }

  return (
    <form onSubmit={run} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
      <label>Window</label>
      <input type="number" value={win} min={2} onChange={e => setWin(parseInt(e.target.value || 24, 10))} />
      <label>Threshold</label>
      <input type="number" step="0.1" value={thr} onChange={e => setThr(parseFloat(e.target.value || 3))} />
      <button>Detect anomalies</button>
    </form>
  );
}
