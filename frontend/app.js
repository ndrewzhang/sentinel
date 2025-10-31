async function fetchDatasets() {
  const res = await fetch("/datasets");
  const items = await res.json();
  const ul = document.getElementById("ds-list");
  ul.innerHTML = "";
  items.forEach(d => {
    const li = document.createElement("li");
    li.textContent = `${d.id} — ${d.name} (${d.source_type})`;
    ul.appendChild(li);
  });
}

document.getElementById("create-ds").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = { name: fd.get("name"), source_type: "upload" };
  const res = await fetch("/datasets", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    e.target.reset();
    fetchDatasets();
  } else {
    const err = await res.json().catch(() => ({}));
    alert(err.detail || "Failed to create dataset");
  }
});

fetchDatasets();

const uploadForm = document.getElementById("upload-form");
if (uploadForm) {
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const datasetId = fd.get("datasetId");
    const res = await fetch(`/ingest/upload?dataset_id=${datasetId}`, {
      method: "POST",
      body: fd,
    });
    const out = document.getElementById("upload-result");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      out.textContent = `Upload failed: ${err.detail || res.status}`;
      return;
    }
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  });
}

const nullForm = document.getElementById("null-form");
if (nullForm) {
  nullForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      column: fd.get("column"),
      max_null_ratio: parseFloat(fd.get("max"))
    };
    const res = await fetch(`/ingest/dq/null_percent?dataset_id=${fd.get("datasetId")}`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const out = document.getElementById("null-result");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      out.textContent = `Error: ${data.detail || res.status}`;
      return;
    }
    out.textContent = JSON.stringify(data, null, 2);
  });
}

const rangeForm = document.getElementById("range-form");
if (rangeForm) {
  rangeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      column: fd.get("column"),
      min_value: fd.get("min") ? parseFloat(fd.get("min")) : null,
      max_value: fd.get("max") ? parseFloat(fd.get("max")) : null
    };
    const res = await fetch(`/ingest/dq/range?dataset_id=${fd.get("datasetId")}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const out = document.getElementById("range-result");
    const data = await res.json().catch(() => ({}));
    out.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error: ${data.detail || res.status}`;
  });
}

const uniqueForm = document.getElementById("unique-form");
if (uniqueForm) {
  uniqueForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { column: fd.get("column") };
    const res = await fetch(`/ingest/dq/unique?dataset_id=${fd.get("datasetId")}`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const out = document.getElementById("unique-result");
    const data = await res.json().catch(() => ({}));
    out.textContent = res.ok ? JSON.stringify(data, null, 2) : `Error: ${data.detail || res.status}`;
  });
}

let dsChart;

function renderSeries(points) {
  const ctx = document.getElementById("chart");
  const labels = points.map(p => p.ts);
  const values = points.map(p => p.value);

  if (dsChart) dsChart.destroy();
  dsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "value", data: values, pointRadius: 0 }]
    },
    options: { responsive: true }
  });
}

const metricForm = document.getElementById("metric-form");
if (metricForm) {
  metricForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const url = `/metrics?dataset_id=${fd.get("datasetId")}&name=${fd.get("name")}&ts_column=${fd.get("ts")}&value_column=${fd.get("val")}`;
    const res = await fetch(url, { method: "POST" });
    const data = await res.json();
    alert(res.ok ? `Metric created ID=${data.id}` : "Failed to create metric");
  });
}

const backfillForm = document.getElementById("backfill-form");
if (backfillForm) {
  backfillForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("metricId");
    const res = await fetch(`/metrics/${id}/backfill`, { method: "POST" });
    const data = await res.json();
    alert(res.ok ? `Backfilled ${data.inserted} points` : "Backfill failed");
  });
}

const seriesForm = document.getElementById("series-form");
if (seriesForm) {
  seriesForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const id = fd.get("metricId");
    const res = await fetch(`/metrics/${id}/series`);
    const data = await res.json();
    if (res.ok) renderSeries(data.points);
    else alert("Failed to load series");
  });
}

async function fetchAnomalies(metricId, window=24, threshold=3) {
  const res = await fetch(`/anomalies/zscore?metric_id=${metricId}&window=${window}&threshold=${threshold}`);
  const data = await res.json();
  return data.anomalies || [];
}
