function getDebugOdometryContent() {
    return `
        <h3>Iterative closest point</h3>
        <button id="captureAButton" class="button" onclick="sendCaptureAMessage()">Capture A</button>
        <button id="CaptureBButton" class="button" onclick="sendCaptureBMessage()">Capture B</button>
        <button id="CompareButton" class="button" onclick="sendCompareMessage()">Compare</button>
    `;
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