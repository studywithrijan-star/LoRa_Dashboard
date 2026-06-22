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
    const current = parseFloat(element.innerText) || 0;
    const target = parseFloat(newValue);
    const stepTime = 30;
    const steps = 10;
    let step = 0;

    const increment = (target - current) / steps;
    const interval = setInterval(() => {
        step++;
        element.innerText = Math.round(current + increment * step);
        if (step >= steps) clearInterval(interval);
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
            plugins: { legend: { display: true } },
            scales: {
                x: {
                    title: { display: true, text: "Time" },
                    ticks: { autoSkip: true, maxRotation: 0, minRotation: 0 }
                },
                y: {
                    title: { display: true, text: yLabel },
                    ticks: {
                        callback: value => Math.round(value)
                    }
                }
            }
        }
    });
}

// ---------- Track last packet for each chart ----------
const lastPacket = {
    node1Temp: null, node1Hum: null,
    node2Temp: null, node2Press: null,
    node3Temp: null, node3Hum: null
};

// ---------- Update chart and latest value ----------
async function updateChart(url, chart, key, chartName, yLabel, latestId) {
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!data || data.length === 0) return;

        // Sort by TX_Time
        data.sort((a, b) => new Date(a.TX_Time) - new Date(b.TX_Time));

        let startIndex = 0;

        if (lastPacket[chartName]) {
            startIndex = data.findIndex(r => r.TX_Time > lastPacket[chartName]);
            if (startIndex === -1) return;
        }

        const newData = data.slice(startIndex);
        if (newData.length === 0) return;

        lastPacket[chartName] = newData[newData.length - 1].TX_Time;

        // Append new labels and data
        chart.data.labels = chart.data.labels.concat(
            newData.map(r => formatTime(r.TX_Time))
        );

        chart.data.datasets[0].data = chart.data.datasets[0].data.concat(
            newData.map(r => Math.round(r[key]))
        );

        // Keep only last 10 readings
        if (chart.data.labels.length > 10) {
            chart.data.labels = chart.data.labels.slice(-10);
            chart.data.datasets[0].data =
                chart.data.datasets[0].data.slice(-10);
        }

        chart.options.scales.y.title.text = yLabel;
        chart.update();

        // Animate latest value
        animateValue(latestId, newData[newData.length - 1][key]);

    } catch (err) {
        console.error("Error fetching data:", err);
    }
}

// ---------- Create all charts ----------
const node1TempChart = createChart(document.getElementById("node1Temp"), "Temperature (°C)", "red", "Temperature (°C)");
const node1HumChart = createChart(document.getElementById("node1Hum"), "Humidity (%)", "blue", "Humidity (%)");
const node2TempChart = createChart(document.getElementById("node2Temp"), "Temperature (°C)", "orange", "Temperature (°C)");
const node2PressChart = createChart(document.getElementById("node2Press"), "Pressure (hPa)", "green", "Pressure (hPa)");
const node3TempChart = createChart(document.getElementById("node3Temp"), "Temperature (°C)", "purple", "Temperature (°C)");
const node3HumChart = createChart(document.getElementById("node3Hum"), "Humidity (%)", "teal", "Humidity (%)");

// ---------- Initial Load ----------
updateChart("/api/node1", node1TempChart, "Temperature (°C)", "node1Temp", "Temperature (°C)", "node1TempLatest");
updateChart("/api/node1", node1HumChart, "Humidity (%)", "node1Hum", "Humidity (%)", "node1HumLatest");
updateChart("/api/node2", node2TempChart, "BMP_Temp (°C)", "node2Temp", "Temperature (°C)", "node2TempLatest");
updateChart("/api/node2", node2PressChart, "BMP_Pressure (hPa)", "node2Press", "Pressure (hPa)", "node2PressLatest");
updateChart("/api/node3", node3TempChart, "Temperature (°C)", "node3Temp", "Temperature (°C)", "node3TempLatest");
updateChart("/api/node3", node3HumChart, "Humidity (%)", "node3Hum", "Humidity (%)", "node3HumLatest");

// ---------- Refresh All Charts Every 1 Minute ----------
setInterval(() => {
    updateChart("/api/node1", node1TempChart, "Temperature (°C)", "node1Temp", "Temperature (°C)", "node1TempLatest");
    updateChart("/api/node1", node1HumChart, "Humidity (%)", "node1Hum", "Humidity (%)", "node1HumLatest");
    updateChart("/api/node2", node2TempChart, "BMP_Temp (°C)", "node2Temp", "Temperature (°C)", "node2TempLatest");
    updateChart("/api/node2", node2PressChart, "BMP_Pressure (hPa)", "node2Press", "Pressure (hPa)", "node2PressLatest");
    updateChart("/api/node3", node3TempChart, "Temperature (°C)", "node3Temp", "Temperature (°C)", "node3TempLatest");
    updateChart("/api/node3", node3HumChart, "Humidity (%)", "node3Hum", "Humidity (%)", "node3HumLatest");
}, 60000);