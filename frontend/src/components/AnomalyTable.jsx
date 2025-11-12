// frontend/src/components/AnomalyTable.jsx
export default function AnomalyTable({ anomalies }) {
  if (!anomalies?.length) return null;

  // sort by timestamp ascending
  const rows = [...anomalies].sort(
    (a, b) => new Date(a.ts) - new Date(b.ts)
  );

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ margin: "8px 0" }}>
        Anomalies detected: {rows.length}
      </h4>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Timestamp</th>
              <th style={th}>Value</th>
              <th style={th}>Z-Score</th>
              <th style={th}>Severity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const sev =
                r.z >= 4 ? "High" : r.z >= 3 ? "Medium" : "Low";
              const sevColor =
                sev === "High" ? "#dc2626" : sev === "Medium" ? "#f97316" : "#2563eb";
              return (
                <tr key={`${r.ts}-${i}`}>
                  <td style={td}>{new Date(r.ts).toLocaleString()}</td>
                  <td style={td}>{r.value}</td>
                  <td style={td}>{r.z.toFixed(2)}</td>
                  <td style={{ ...td, color: sevColor, fontWeight: 600 }}>{sev}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const td = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  verticalAlign: "top",
};
