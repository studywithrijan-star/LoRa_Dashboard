fetch("/api/node1")
.then(response => response.json())
.then(data => {

    const labels = data.map(row => row.PacketNo);
    const temp = data.map(row => row["Temperature (°C)"]);

    new Chart(document.getElementById("node1Chart"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Temperature",
                data: temp
            }]
        }
    });

});