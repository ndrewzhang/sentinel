// frontend/src/components/MetricsChart.jsx
import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TimeSeriesScale,
} from "chart.js";
import AnomalyOverlay from "./AnomalyOverlay";
import AnomalyTable from "./AnomalyTable";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  TimeSeriesScale
);

export default function MetricsChart() {
  const [metricId, setMetricId] = useState("");
  const [points, setPoints] = useState([]);
  const [anoms, setAnoms] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchSeries(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/metrics/${metricId}/series`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to load series");
      setPoints(data.points || []);
      setAnoms([]); // reset overlay
      setError("");
    } catch (err) {
      setError(String(err));
      setPoints([]);
      setAnoms([]);
    } finally {
      setLoading(false);
    }
  }

  function clearAnomalies() {
    setAnoms([]);
  }

  // ---- Chart data (aligned anomalies) ----
  // Normalize timestamps to ISO to guarantee exact matching
  const labels = points.map((p) => new Date(p.ts).toISOString());
  const values = points.map((p) => p.value);

  // Build a Set of anomaly timestamps (also ISO)
  const anomSet = new Set(
    (anoms || []).map((a) => new Date(a.ts).toISOString())
  );

  // Create an array aligned to labels: value for anomalies, null otherwise
  const anomalyData = points.map((p) =>
    anomSet.has(new Date(p.ts).toISOString()) ? p.value : null
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Value",
        data: values,
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.2,
        order: 1, // draw beneath dots
      },
      {
        label: "Anomalies",
        data: anomalyData, // aligned series with nulls
        showLine: false,
        borderWidth: 0,
        pointRadius: (ctx) => (ctx.raw == null ? 0 : 6),
        pointHoverRadius: (ctx) => (ctx.raw == null ? 0 : 7),
        pointBackgroundColor: "rgb(220, 38, 38)",
        pointBorderColor: "rgb(220, 38, 38)",
        order: 2, // draw on top
      },
    ],
  };

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Metric Visualization</h3>

      <form
        onSubmit={fetchSeries}
        style={{ marginBottom: 12, display: "flex", gap: 8 }}
      >
        <input
          value={metricId}
          onChange={(e) => setMetricId(e.target.value)}
          placeholder="Metric ID"
          required
        />
        <button disabled={loading}>
          {loading ? "Loading..." : "Load Series"}
        </button>
        {anoms.length > 0 && (
          <button type="button" onClick={clearAnomalies} style={{ marginLeft: 8 }}>
            Clear anomalies
          </button>
        )}
      </form>

      {error && <div style={{ color: "tomato", marginBottom: 8 }}>{error}</div>}

      {points.length > 0 ? (
        <>
          <Line data={chartData} />
          <AnomalyOverlay metricId={metricId} onOverlay={(arr) => setAnoms(arr)} />
          <AnomalyTable anomalies={anoms} />
        </>
      ) : (
        <div style={{ color: "#64748b" }}>
          Enter a Metric ID and click <b>Load Series</b> to visualize.
        </div>
      )}
    </div>
  );
}
