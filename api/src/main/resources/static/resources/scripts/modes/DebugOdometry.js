function getDebugOdometryContent() {
    return `
        <h3>Iterative closest point</h3>
        <button id="captureAButton" class="button" onclick="sendCaptureAMessage()">Capture A</button>
        <button id="CaptureBButton" class="button" onclick="sendCaptureBMessage()">Capture B</button>
        <button id="CompareButton" class="button" onclick="sendCompareMessage()">Compare</button>

        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="displayCurrentLidarDataToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('displayCurrentLidarDataToggle').click()">Display Current LiDAR Data</p>
            </div>
        </div>
    `;
}

function addDebugOdometryCode() {
    const displayCurrentLidarDataToggle = document.getElementById('displayCurrentLidarDataToggle');

    displayCurrentLidarDataToggle.checked = showLidarData;
    
    displayCurrentLidarDataToggle.addEventListener('change', function() {
        showLidarData = displayCurrentLidarDataToggle.checked;
    });
}

function sendCaptureAMessage() {
    sendMessage(`{"command": "debugOdometry", "action": "captureA"}`);
}

function sendCaptureBMessage() {
    sendMessage(`{"command": "debugOdometry", "action": "captureB"}`);
}

function sendCompareMessage() {
    sendMessage(`{"command": "debugOdometry", "action": "compare"}`);
}