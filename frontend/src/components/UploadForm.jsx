// frontend/src/components/UploadForm.jsx
import { useState } from "react";

export default function UploadForm() {
  const [status, setStatus] = useState("");

  async function handleUpload(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const datasetId = fd.get("datasetId");
    setStatus("Uploading...");
    const res = await fetch(`/ingest/upload?dataset_id=${datasetId}`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(`❌ ${err.detail || res.status}`);
      return;
    }
    const data = await res.json();
    setStatus(`✅ ${data.inserted ?? "Uploaded"}`);
    e.target.reset();
  }

  return (
    <form onSubmit={handleUpload} style={{marginTop: 16}}>
      <input name="datasetId" placeholder="Dataset ID" required />
      <input name="file" type="file" accept=".csv" required />
      <button type="submit">Upload CSV</button>
      <div style={{marginTop: 8}}>{status}</div>
    </form>
  );
}
