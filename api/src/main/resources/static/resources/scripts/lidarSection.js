const botSize = 30; // in cm

let canvas, lidarCtx, centerX, centerY;

document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("lidarCanvas");
    lidarCtx = canvas.getContext("2d");
    
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
})

function processLidarData(data) { //DO NOT REMOVE even if Unnecessary at the moment! (this will later handle drawing paths and lidarData separately)
    lidarCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawLidarData(data);
}

function drawLidarData(data) {
    const maxDistance = Math.max(...data.map(point => parseFloat(point.distance)));
    const scale = Math.min(canvas.width, canvas.height) / (maxDistance * 2);
    
    drawBot();
    
    data.forEach(point => {
        const angleDeg = parseFloat(point.angle);
        const distanceCm = parseFloat(point.distance);

        if (isNaN(angleDeg) || isNaN(distanceCm)) return;
            
        // Adjust the angle to make 0 at the top and 180 at the bottom
        const adjustedAngle = angleDeg + 90; // Shift angle 90 degrees counter-clockwise
        const angleRad = (adjustedAngle * Math.PI) / 180; // Convert to radians

        // Convert polar to Cartesian coordinates
        const x = centerX + distanceCm * scale * Math.cos(angleRad);
        const y = centerY - distanceCm * scale * Math.sin(angleRad);
        
        drawLidarPoint(x, y);
    });
}

function drawBot() {
    lidarCtx.fillStyle = "red";
    lidarCtx.beginPath();
    lidarCtx.arc(centerX, centerY, botSize / 2, 0, Math.PI * 2);
    lidarCtx.fill();
}

function drawLidarPoint(x, y) {
    lidarCtx.fillStyle = "lime";
    lidarCtx.beginPath();
    lidarCtx.arc(x, y, 2 * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}