import { useState } from "react";

export default function CreateMetricForm() {
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const url = `/metrics?dataset_id=${fd.get("datasetId")}&name=${fd.get("name")}&ts_column=${fd.get("ts")}&value_column=${fd.get("val")}`;
    setStatus("Creating metric...");
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setStatus(`✅ Metric created (ID ${data.id})`);
      e.target.reset();
    } else {
      setStatus(`❌ ${data.detail || "Failed"}`);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Create Metric</h3>
      <form onSubmit={handleSubmit}>
        <input name="datasetId" placeholder="Dataset ID" required />
        <input name="name" placeholder="Metric name (e.g. sales)" required />
        <input name="ts" placeholder="Timestamp column" required />
        <input name="val" placeholder="Value column" required />
        <button type="submit">Create</button>
      </form>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
