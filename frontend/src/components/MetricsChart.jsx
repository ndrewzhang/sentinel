import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function MetricsChart() {
  const [metricId, setMetricId] = useState("");
  const [points, setPoints] = useState([]);
  const [error, setError] = useState("");

  async function fetchSeries(e) {
    e.preventDefault();
    try {
      const res = await fetch(`/metrics/${metricId}/series`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setPoints(data.points || []);
      setError("");
    } catch (err) {
      setError(String(err));
      setPoints([]);
    }
  }

  const chartData = {
    labels: points.map((p) => p.ts),
    datasets: [
      {
        label: "Value",
        data: points.map((p) => p.value),
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  return (
    <div style={{marginTop: 24}}>
      <h3>Metric Visualization</h3>
      <form onSubmit={fetchSeries} style={{marginBottom: 12}}>
        <input
          value={metricId}
          onChange={(e) => setMetricId(e.target.value)}
          placeholder="Metric ID"
          required
        />
        <button>Load Series</button>
      </form>
      {error && <div style={{color:"tomato"}}>{error}</div>}
      {points.length > 0 && <Line data={chartData} />}
    </div>
  );
}
