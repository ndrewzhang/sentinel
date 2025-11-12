import { useEffect, useState } from "react";
import DatasetForm from "./components/DatasetForm";
import UploadForm from "./components/UploadForm";
import DataQualityCheckForm from "./components/DataQualityCheckForm";
import "./App.css";
import MetricsChart from "./components/MetricsChart";
import CreateMetricForm from "./components/CreateMetricForm";
import BackfillMetricForm from "./components/BackfillMetricForm";
import AIPanel from "./components/AIPanel";
import AIAssist from "./components/AIAssist";


export default function App() {
  const [datasets, setDatasets] = useState([]);
  const [error, setError] = useState("");

  async function fetchDatasets() {
    try {
      setError("");
      const res = await fetch("/datasets");
      if (!res.ok) throw new Error(`GET /datasets ${res.status}`);
      const items = await res.json();
      setDatasets(items);
    } catch (err) {
      setError(String(err));
      setDatasets([]);
    }
  }

  useEffect(() => { fetchDatasets(); }, []);

  return (
    <div className="App" style={{padding: 24}}>
      <h1>DataSentinel Dashboard</h1>

      {error && (
        <div style={{ color: "tomato", marginBottom: 12 }}>
          {error} — check backend & proxy config.
        </div>
      )}

      <DatasetForm onCreated={fetchDatasets} />

      <h3>Datasets</h3>
      <ul>
        {datasets.map(d => (
          <li key={d.id}>{d.id} — {d.name} ({d.source_type})</li>
        ))}
      </ul>

      <UploadForm />
      <DataQualityCheckForm />
      <MetricsChart />
      <CreateMetricForm />
      <BackfillMetricForm />
      <AIPanel />
      <AIAssist />

    </div>
  );
}
