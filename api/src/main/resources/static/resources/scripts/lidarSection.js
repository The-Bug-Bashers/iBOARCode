document.addEventListener("DOMContentLoaded", () => {
    initialiseCanvas();
})

function initialiseCanvas() {
    canvas = document.getElementById("lidarCanvas");
    lidarCtx = canvas.getContext("2d");

    calculateCanvasHeight()

    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

function calculateCanvasHeight() {
    const parent = canvas.parentElement;
    const size = Math.min(parent.clientWidth - 118, parent.clientHeight - 70) ;
    canvas.width = size;
    canvas.height = size;
}

function processLidarData(data) { //DO NOT REMOVE even if Unnecessary at the moment! (this will later handle drawing paths and lidarData separately)
    lidarCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawLidarData(data);
}

function drawLidarData(data) {
    const maxDistance = Math.max(...data.map(point => parseFloat(point.distance)));
    scale = maxDistance > 0 ? Math.min(canvas.width, canvas.height) / (maxDistance * 2) : 1;
    
    drawBot();
    
    data.forEach(point => {
        const angleDeg = parseFloat(point.angle);
        const distanceCm = parseFloat(point.distance);

        if (isNaN(angleDeg) || isNaN(distanceCm)) return;
            
        // Adjust the angle to make 0 at the top and 180 at the bottom
        const adjustedAngle = angleDeg - 90; // Shift angle 90 degrees clockwise
        const angleRad = (adjustedAngle * Math.PI) / 180; // Convert to radians

        // Convert polar to Cartesian coordinates
        const x = centerX + distanceCm * scale * Math.cos(angleRad);
        const y = centerY + distanceCm * scale * Math.sin(angleRad);
        
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
    lidarCtx.arc(x, y, 0.01 * scale, 0, Math.PI * 2);
    lidarCtx.fill();
}