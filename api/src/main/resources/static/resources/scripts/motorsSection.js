ctx = document.getElementById('combinedChart').getContext('2d');
combinedChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'Motor 1 Actual', data: [], borderColor: 'blue', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 },
            { label: 'Motor 1 Target', data: [], borderColor: 'red', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'Motor 1 Pid', data: [], borderColor: 'red', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] },
            { label: 'Motor 2 Actual', data: [], borderColor: 'green', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 },
            { label: 'Motor 2 Target', data: [], borderColor: 'orange', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'Motor 2 Pid', data: [], borderColor: 'orange', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] },
            { label: 'Motor 3 Actual', data: [], borderColor: 'purple', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 },
            { label: 'Motor 3 Target', data: [], borderColor: 'pink', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'Motor 3 Pid', data:
                    [], borderColor: 'pink', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                title: { display: true, text: 'Time' },
                ticks: { display: false }
            },
            y: { title: { display: true, text: 'Speed (RPM)' }, suggestedMin: -150, suggestedMax: 150 }
        },
        animation: {
            duration: 0
        }
    }
});

function updateChart(actual1, target1, pid_output1, actual2, target2, pid_output2, actual3, target3, pid_output3) {
    const time = new Date().toLocaleTimeString();
    const labels = combinedChart.data.labels;
    const datasets = combinedChart.data.datasets;

    if (labels.length > 50) {
        labels.shift();
        datasets.forEach(dataset => dataset.data.shift());
    }

    labels.push(time);
    datasets[0].data.push(actual1);
    datasets[1].data.push(target1);
    datasets[2].data.push(pid_output1);
    datasets[3].data.push(actual2);
    datasets[4].data.push(target2);
    datasets[5].data.push(pid_output2);
    datasets[6].data.push(actual3);
    datasets[7].data.push(target3);
    datasets[8].data.push(pid_output3);

    combinedChart.update();
}

function addMotorRendererDataSocketListener() {
    dataSocket.onmessage = function (event) {
        processData(event.data);
        console.log("Received: " + event.data);
    };
}

function processData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        updateChart(
            data.motor1.actual, data.motor1.target, data.motor1.pid_output,
            data.motor2.actual, data.motor2.target, data.motor2.pid_output,
            data.motor3.actual, data.motor3.target, data.motor3.pid_output
        );
    } catch (error) {
        console.error("Invalid JSON data:", error);
    }
}