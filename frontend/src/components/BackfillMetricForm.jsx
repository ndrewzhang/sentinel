import { useState } from "react";

export default function BackfillMetricForm() {
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const metricId = fd.get("metricId");
    setStatus("Backfilling...");
    const res = await fetch(`/metrics/${metricId}/backfill`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setStatus(`✅ Backfilled ${data.inserted} points`);
      e.target.reset();
    } else {
      setStatus(`❌ ${data.detail || "Failed"}`);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Backfill Metric</h3>
      <form onSubmit={handleSubmit}>
        <input name="metricId" placeholder="Metric ID" required />
        <button type="submit">Backfill</button>
      </form>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
