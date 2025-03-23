ctx = document.getElementById('combinedChart').getContext('2d');
Chart.defaults.color = '#ffffff';

combinedChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            { label: 'M1 Actual', data: [], borderColor: '#2f6ef6', borderWidth: 2, backgroundColor: 'rgba(7,41,255,0.25)', fill: true, tension: 0.1, pointRadius: 0 },
            { label: 'M2 Actual', data: [], borderColor: '#d8091f', borderWidth: 2, backgroundColor: 'rgba(255,7,28,0.24)', fill: true, tension: 0.1, pointRadius: 0 },
            { label: 'M3 Actual', data: [], borderColor: '#0fbc08', borderWidth: 2, backgroundColor: 'rgba(40,255,7,0.3)', fill: true, tension: 0.1, pointRadius: 0 },
            { label: 'M1 Target', data: [], borderColor: '#84bce3', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'M2 Target', data: [], borderColor: '#e16473', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'M3 Target', data: [], borderColor: '#80cd5d', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [6, 5] },
            { label: 'M1 Pid', data: [], borderColor: '#5661ed', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] },
            { label: 'M2 Pid', data: [], borderColor: '#8f113b', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] },
            { label: 'M3 Pid', data: [], borderColor: '#308a12', borderWidth: 2, backgroundColor: '#43454a', fill: false, tension: 0.1, pointRadius: 0, borderDash: [3, 3] }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: {
                grid: {
                    color: '#8e8989',
                    display: true,
                },
                title: {display: true, text: 'Time'},
                ticks: {display: false},
            },
            y: {
                grid: {
                    color: '#8e8989',
                    display: true,
                },
                title: {display: true, text: 'Speed (RPM)'},
                suggestedMin: -75, suggestedMax: 75

            },
        },
        animation: {
            duration: 0
        }
    }
});

function updateChart(actual1, actual2, actual3, target1, target2, target3, pid_output1, pid_output2, pid_output3) {
    const time = new Date().toLocaleTimeString();
    const labels = combinedChart.data.labels;
    const datasets = combinedChart.data.datasets;

    if (labels.length > 50) {
        labels.shift();
        datasets.forEach(dataset => dataset.data.shift());
    }

    labels.push(time);
    datasets[0].data.push(actual1);
    datasets[1].data.push(actual2);
    datasets[2].data.push(actual3);
    datasets[3].data.push(target1);
    datasets[4].data.push(target2);
    datasets[5].data.push(target3);
    datasets[6].data.push(pid_output1);
    datasets[7].data.push(pid_output2);
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
            data.motor1.actual, data.motor2.actual, data.motor3.actual,
            data.motor1.target, data.motor2.target, data.motor3.target,
            data.motor1.pid_output, data.motor2.pid_output, data.motor3.pid_output
        );
    } catch (error) {
        console.error("Invalid JSON data:", error);
    }
}