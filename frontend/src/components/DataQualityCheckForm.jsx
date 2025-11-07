// frontend/src/components/DataQualityCheckForm.jsx
import { useState } from "react";

export default function DataQualityCheckForm() {
  const [output, setOutput] = useState("");

  async function runNullCheck(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      column: fd.get("column"),
      max_null_ratio: parseFloat(fd.get("max")),
    };
    const res = await fetch(`/ingest/dq/null_percent?dataset_id=${fd.get("datasetId")}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(()=>({}));
    setOutput(res.ok ? JSON.stringify(data, null, 2) : `Error: ${data.detail || res.status}`);
  }

  return (
    <div style={{marginTop: 24}}>
      <h3>Null % Check</h3>
      <form onSubmit={runNullCheck}>
        <input name="datasetId" placeholder="Dataset ID" required />
        <input name="column" placeholder="Column (e.g., age)" required />
        <input name="max" type="number" step="0.01" placeholder="Max null ratio (e.g., 0.2)" required />
        <button type="submit">Run</button>
      </form>
      <pre style={{textAlign:"left"}}>{output}</pre>
    </div>
  );
}
