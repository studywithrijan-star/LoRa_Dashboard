// ─────────────────────────────────────────────────────────────────
//  dashboard.js
// ─────────────────────────────────────────────────────────────────

// ---------- Format TX_Time to HH:MM ----------
function formatTime(txTime) {
    let t = txTime.split(" ")[1] || txTime;
    let p = t.split(":");
    return p[0] + ":" + p[1];
}

// ---------- Animate number changes ----------
function animateValue(id, newValue) {
    const element = document.getElementById(id);
    if (!element) return;

    const target = parseFloat(newValue);
    if (isNaN(target)) return;

    const currentText = element.innerText.trim();
    const current = isNaN(parseFloat(currentText)) ? 0 : parseFloat(currentText);

    const stepTime  = 30;
    const steps     = 10;
    let   step      = 0;
    const increment = (target - current) / steps;

    const interval = setInterval(() => {
        step++;
        element.innerText = Math.round(current + increment * step);
        if (step >= steps) {
            element.innerText = Math.round(target);
            clearInterval(interval);
        }
    }, stepTime);
}

// ---------- Create simple line chart ----------
function createChart(ctx, label, color, yLabel) {
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
                borderColor: color,
                fill: false,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: ctx => `${ctx.dataset.label}: ${Math.round(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: "Time" },
                    ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 }
                },
                y: {
                    title: { display: true, text: yLabel },
                    ticks: {
                        precision: 0,
                        maxTicksLimit: 5
                    }
                }
            }
        }
    });
}

// ---------- Status badge helpers ----------
function setBadge(ids, live) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = `node-status ${live ? "live" : "offline"}`;
        el.innerHTML = `<span class="dot"></span>${live ? "Live" : "Offline"}`;
    });
}

function setLastUpdated(nodeNum) {
    const el = document.getElementById(`last-updated-${nodeNum}`);
    if (!el) return;
    const now = new Date();
    el.textContent = `Last updated: ${now.toLocaleTimeString([], {
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    })}`;
}

function hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
}

// ---------- Track last packet per chart ----------
const lastPacket = {
    node1Temp: null, node1Hum: null,
    node2Temp: null, node2Press: null,
    node3Temp: null, node3Hum: null
};

// ---------- Core update function ----------
async function updateChart(url, chart, key, chartName, yLabel, latestId, nodeNum, overlayIds) {
    try {
        const res  = await fetch(url);
        const data = await res.json();

        if (!data || data.length === 0) return;

        data.sort((a, b) => new Date(a.TX_Time) - new Date(b.TX_Time));

        const latestRow = data[data.length - 1];
        const latestVal = parseFloat(latestRow[key]);
        if (!isNaN(latestVal)) {
            const el = document.getElementById(latestId);
            if (el && el.innerText !== String(Math.round(latestVal))) {
                animateValue(latestId, latestVal);
            }
        }

        setBadge([`status-badge-${nodeNum}`, `status-badge-${nodeNum}b`], true);
        setLastUpdated(nodeNum);
        if (overlayIds) overlayIds.forEach(hideOverlay);

        let startIndex = 0;
        if (lastPacket[chartName]) {
            startIndex = data.findIndex(r => r.TX_Time > lastPacket[chartName]);
            if (startIndex === -1) return;
        }

        const newData = data.slice(startIndex);
        if (newData.length === 0) return;

        lastPacket[chartName] = newData[newData.length - 1].TX_Time;

        chart.data.labels = chart.data.labels.concat(
            newData.map(r => formatTime(r.TX_Time))
        );
        chart.data.datasets[0].data = chart.data.datasets[0].data.concat(
            newData.map(r => Math.round(parseFloat(r[key])))
        );

        if (chart.data.labels.length > 50) {
            chart.data.labels           = chart.data.labels.slice(-50);
            chart.data.datasets[0].data = chart.data.datasets[0].data.slice(-50);
        }

        chart.options.scales.y.title.text = yLabel;
        chart.update();

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

// ---------- Create all charts ----------
const node1TempChart  = createChart(document.getElementById("node1Temp"),  "Temperature (°C)", "red",    "Temperature (°C)");
const node1HumChart   = createChart(document.getElementById("node1Hum"),   "Humidity (%)",     "blue",   "Humidity (%)");
const node2TempChart  = createChart(document.getElementById("node2Temp"),  "Temperature (°C)", "orange", "Temperature (°C)");
const node2PressChart = createChart(document.getElementById("node2Press"), "Pressure (hPa)",   "green",  "Pressure (hPa)");
const node3TempChart  = createChart(document.getElementById("node3Temp"),  "Temperature (°C)", "purple", "Temperature (°C)");
const node3HumChart   = createChart(document.getElementById("node3Hum"),   "Humidity (%)",     "teal",   "Humidity (%)");

// ---------- Initial load ----------
updateChart("/api/node1", node1TempChart,  "Temperature (°C)",   "node1Temp",  "Temperature (°C)", "node1TempLatest",  1, ["overlay-node1Temp"]);
updateChart("/api/node1", node1HumChart,   "Humidity (%)",       "node1Hum",   "Humidity (%)",     "node1HumLatest",   1, ["overlay-node1Hum"]);
updateChart("/api/node2", node2TempChart,  "BMP_Temp (°C)",      "node2Temp",  "Temperature (°C)", "node2TempLatest",  2, ["overlay-node2Temp"]);
updateChart("/api/node2", node2PressChart, "BMP_Pressure (hPa)", "node2Press", "Pressure (hPa)",   "node2PressLatest", 2, ["overlay-node2Press"]);
updateChart("/api/node3", node3TempChart,  "Temperature (°C)",   "node3Temp",  "Temperature (°C)", "node3TempLatest",  3, ["overlay-node3Temp"]);
updateChart("/api/node3", node3HumChart,   "Humidity (%)",       "node3Hum",   "Humidity (%)",     "node3HumLatest",   3, ["overlay-node3Hum"]);

// ---------- Refresh every 60 seconds ----------
setInterval(() => {
    updateChart("/api/node1", node1TempChart,  "Temperature (°C)",   "node1Temp",  "Temperature (°C)", "node1TempLatest",  1, ["overlay-node1Temp"]);
    updateChart("/api/node1", node1HumChart,   "Humidity (%)",       "node1Hum",   "Humidity (%)",     "node1HumLatest",   1, ["overlay-node1Hum"]);
    updateChart("/api/node2", node2TempChart,  "BMP_Temp (°C)",      "node2Temp",  "Temperature (°C)", "node2TempLatest",  2, ["overlay-node2Temp"]);
    updateChart("/api/node2", node2PressChart, "BMP_Pressure (hPa)", "node2Press", "Pressure (hPa)",   "node2PressLatest", 2, ["overlay-node2Press"]);
    updateChart("/api/node3", node3TempChart,  "Temperature (°C)",   "node3Temp",  "Temperature (°C)", "node3TempLatest",  3, ["overlay-node3Temp"]);
    updateChart("/api/node3", node3HumChart,   "Humidity (%)",       "node3Hum",   "Humidity (%)",     "node3HumLatest",   3, ["overlay-node3Hum"]);
}, 60000);