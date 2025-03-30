let currentNavigationData;
document.addEventListener("DOMContentLoaded", () => {
    initialiseCanvas();
})

function initialiseCanvas() {
    canvas = document.getElementById("lidarCanvas");
    lidarCtx = canvas.getContext("2d");

    calculateCanvasSize()
}

function calculateCanvasSize() {
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth - 118, parent.clientHeight - 70) ;
    canvas.width = size;
    canvas.height = size;

    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

function processLidarData(data) {
    lidarCtx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentNavigationData) drawNavigationData(currentNavigationData);
    drawLidarData(data);
}

function processNavigationData(data) {
    if (!Array.isArray(data)) {
        console.error("Invalid navigationData format:", data);
        return;
    }

    currentNavigationData = data;
}

function drawNavigationData(data) {
    data.forEach(entry => {
        if (entry.drawPath) {
            const { angle, distance } = entry.drawPath;

            if (isNaN(angle) || isNaN(distance)) {
                console.error("Invalid drawPath values:", entry.drawPath);
                return;
            }

            // Convert polar coordinates to Cartesian
            const adjustedAngle = angle - 90; // Shift angle 90 degrees clockwise
            const angleRad = (adjustedAngle * Math.PI) / 180;
            const x = centerX + distance * scale * Math.cos(angleRad);
            const y = centerY + distance * scale * Math.sin(angleRad);

            drawNavigationPath(x, y);
        }
    });
}

function drawLidarData(data) {
    const maxDistance = Math.max(...data.map(point => parseFloat(point.distance)));
    scale = maxDistance > 0 ? Math.min(canvas.width, canvas.height) / (maxDistance * 2) : 1;

    drawBot();

    data.forEach(point => {
        const angleDeg = parseFloat(point.angle);
        const distanceM = parseFloat(point.distance); // in meters

        if (isNaN(angleDeg) || isNaN(distanceM)) return;

        // Adjust the angle to make 0 at the top and 180 at the bottom
        const adjustedAngle = angleDeg - 90; // Shift angle 90 degrees clockwise
        const angleRad = (adjustedAngle * Math.PI) / 180; // Convert to radians

        // Convert polar to Cartesian coordinates
        const x = centerX + distanceM * scale * Math.cos(angleRad);
        const y = centerY + distanceM * scale * Math.sin(angleRad);

        drawLidarPoint(x, y);
    });
}


function drawNavigationPath(x, y) {
    lidarCtx.strokeStyle = "deepskyblue";
    lidarCtx.lineWidth = (botSize / 2) * (scale * 0.008);

    lidarCtx.beginPath();
    lidarCtx.moveTo(centerX, centerY);
    lidarCtx.lineTo(x, y);
    lidarCtx.strokeStyle = "blue";
    lidarCtx.stroke();

    lidarCtx.moveTo(x, y);
    lidarCtx.fillStyle = "red";
    lidarCtx.beginPath();
    lidarCtx.arc(centerX, centerY, (botSize / 2) * (scale * 0.008), 0, Math.PI * 2);
    lidarCtx.fill();
}

function drawBot() {
    lidarCtx.fillStyle = "coral";
    lidarCtx.beginPath();
    lidarCtx.arc(centerX, centerY, (botSize / 2) * (scale * 0.008), 0, Math.PI * 2);
    lidarCtx.fill();
}

function drawLidarPoint(x, y) {
    lidarCtx.fillStyle = "white";
    lidarCtx.beginPath();
    lidarCtx.arc(x, y, 0.01 * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}