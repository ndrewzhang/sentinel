// frontend/src/components/DatasetForm.jsx
import { useState } from "react";

export default function DatasetForm({ onCreated }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Creating...");
    const res = await fetch("/datasets", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ name, source_type: "upload" })
    });
    if (res.ok) {
      setName("");
      setStatus("✅ Created");
      onCreated?.();
    } else {
      const err = await res.json().catch(() => ({}));
      setStatus(`❌ ${err.detail || "Failed"}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{marginBottom: 16}}>
      <input
        value={name}
        onChange={(e)=>setName(e.target.value)}
        placeholder="Dataset name"
        required
      />
      <button type="submit">Create dataset</button>
      <span style={{marginLeft: 8}}>{status}</span>
    </form>
  );
}
