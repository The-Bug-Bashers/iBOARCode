let currentNavigationData;
let currentBufferDistance = 0;
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
        if (entry.buffer) {
            currentBufferDistance = entry.buffer.buffer * 0.01; // Convert cm to m
        } else if (entry.drawPath) {
            const {angle, distance} = entry.drawPath;

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
        } else if (entry.drawZone) {
            const {direction, width, colour} = entry.drawZone;
            
            if (isNaN(direction) || isNaN(width) || typeof colour !== "string") {
                console.error("Invalid drawZone values:", entry.drawZone);
                return;
            }
            
            drawZone(direction - 90, width, colour);
        }
    });
}

function drawLidarData(data) {
    let maxDistance;
    if (lockLidarZoom) {
        maxDistance = 0.01 * lockLidarZoomValue;
    } else {
        maxDistance = (Math.max(...data.map(point => parseFloat(point.distance))));
    }
    scale = Math.min(canvas.width, canvas.height) / (maxDistance * 2);


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
    if (currentBufferDistance !== 0) {
        lidarCtx.strokeStyle = "darkkhaki";
        lidarCtx.lineWidth = (botSize + currentBufferDistance) * scale;
        lidarCtx.lineCap = "round";
        lidarCtx.beginPath();
        lidarCtx.moveTo(centerX, centerY);
        lidarCtx.lineTo(x, y);
        lidarCtx.stroke();

        lidarCtx.fillStyle = "darkkhaki";
        lidarCtx.beginPath();
        lidarCtx.arc(x, y, ((botSize + currentBufferDistance) / 2) * scale, 0, Math.PI * 2);
        lidarCtx.fill();
    }
    lidarCtx.strokeStyle = "royalblue";
    lidarCtx.lineWidth = botSize * scale;
    lidarCtx.beginPath();
    lidarCtx.moveTo(x, y);
    lidarCtx.lineTo(centerX, centerY);
    lidarCtx.stroke();

    lidarCtx.fillStyle = "cornflowerblue";
    lidarCtx.beginPath();
    lidarCtx.arc(x, y, (botSize / 2) * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}

function drawZone(direction, width, colour) {
    const halfWidth = width / 2;
    const startAngle = ((direction - halfWidth) * (Math.PI / 180)); // Convert to radians
    const endAngle = ((direction + halfWidth)) * (Math.PI / 180);
    const radius = Math.min(canvas.width, canvas.height) / 2; // Extend to canvas edge

    lidarCtx.fillStyle = colour;
    lidarCtx.beginPath();
    lidarCtx.moveTo(centerX, centerY);
    lidarCtx.arc(centerX, centerY, radius, startAngle, endAngle);
    lidarCtx.closePath();
    lidarCtx.fill();
}

function drawBot() {
    if (currentBufferDistance !== 0) {
        lidarCtx.fillStyle = "darkkhaki";
        lidarCtx.beginPath();
        lidarCtx.arc(centerX, centerY, ((botSize + currentBufferDistance) / 2) * scale, 0, Math.PI * 2);
        lidarCtx.fill();
    }
    lidarCtx.fillStyle = "coral";
    lidarCtx.beginPath();
    lidarCtx.arc(centerX, centerY, (botSize / 2) * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}

function drawLidarPoint(x, y) {
    lidarCtx.fillStyle = "white";
    lidarCtx.beginPath();
    lidarCtx.arc(x, y, 0.01 * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}