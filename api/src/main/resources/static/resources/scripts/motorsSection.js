const ctx = document.getElementById('combinedChart').getContext('2d');
const combinedChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Motor 1 Actual', data: [], borderColor: 'blue', borderWidth: 2, fill: false, tension: 0.1 },
            { label: 'Motor 1 Target', data: [], borderColor: 'red', borderWidth: 2, fill: false, borderDash: [5, 5], tension: 0.1 },
            { label: 'Motor 2 Actual', data: [], borderColor: 'green', borderWidth: 2, fill: false, tension: 0.1 },
            { label: 'Motor 2 Target', data: [], borderColor: 'orange', borderWidth: 2, fill: false, borderDash: [5, 5], tension: 0.1 },
            { label: 'Motor 3 Actual', data: [], borderColor: 'purple', borderWidth: 2, fill: false, tension: 0.1 },
            { label: 'Motor 3 Target', data: [], borderColor: 'pink', borderWidth: 2, fill: false, borderDash: [5, 5], tension: 0.1 }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Time' } },
            y: { title: { display: true, text: 'Speed (RPM)' }, suggestedMin: -600, suggestedMax: 600 }
        },
        animation: {
            duration: 0
        }
    }
});

function updateChart(actual1, target1, actual2, target2, actual3, target3) {
    const time = new Date().toLocaleTimeString();
    const labels = combinedChart.data.labels;
    const datasets = combinedChart.data.datasets;

    if (labels.length > 20) {
        labels.shift();
        datasets.forEach(dataset => dataset.data.shift());
    }

    labels.push(time);
    datasets[0].data.push(actual1);
    datasets[1].data.push(target1);
    datasets[2].data.push(actual2);
    datasets[3].data.push(target2);
    datasets[4].data.push(actual3);
    datasets[5].data.push(target3);

    combinedChart.update();
}

dataSocket.onmessage = function(event) {
    processData(event.data);
    console.log("Received: " + event.data);
};

function processData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        updateChart(
            data.motor1.actual, data.motor1.target,
            data.motor2.actual, data.motor2.target,
            data.motor3.actual, data.motor3.target
        );
    } catch (error) {
        console.error("Invalid JSON data:", error);
    }
}