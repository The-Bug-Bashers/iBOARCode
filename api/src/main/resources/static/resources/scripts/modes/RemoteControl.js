function getRemoteControlContent() {
    return `
        <h3>Directions</h3>
        <div id="directionRemoteControlButtons" class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="forwardRemoteControlCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('forwardRemoteControlCheckbox').click()">Forward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="rightRemoteControlCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('rightRemoteControlCheckbox').click()">Right</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="backwardRemoteControlCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('backwardRemoteControlCheckbox').click()">Backward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="leftRemoteControlCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('leftRemoteControlCheckbox').click()">Left</p>
            </div>
        </div>
        <h3>Turn</h3>
        <button id="turnLeftButton" class="button">left</button>
        <button id="turnRightButton" class="button">right</button>
        <h3>Speed</h3>
        <div class="inputBorder">
            <input type="number" min="0" max="100" id="speedRemoteControlInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
        </div>
    `;
}

function addRemoteControlCode() {
    // Event listener for the direction switches
    document.querySelectorAll('#directionRemoteControlButtons input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {
            const speed = document.getElementById("speedRemoteControlInput").value;
            const forward = document.getElementById("forwardRemoteControlCheckbox");
            const right = document.getElementById("rightRemoteControlCheckbox");
            const backward = document.getElementById("backwardRemoteControlCheckbox");
            const left = document.getElementById("leftRemoteControlCheckbox");

            if (event.target.id === "forwardRemoteControlCheckbox" && backward.checked) {
                backward.checked = false;
            } else if (event.target.id === "backwardRemoteControlCheckbox" && forward.checked) {
                forward.checked = false;
            } else if (event.target.id === "rightRemoteControlCheckbox" && left.checked) {
                left.checked = false;
            } else if (event.target.id === "leftRemoteControlCheckbox" && right.checked) {
                right.checked = false;
            }

            let angleSum = 0;
            let count = 0;
            if (forward.checked) {
                angleSum += 0;
                count++;
            } else if (backward.checked) {
                angleSum += 180;
                count++;
            }
            if (right.checked) {
                angleSum += 90;
                count++;
            } else if (left.checked) {
                if (forward.checked) {
                    count = 0;
                    angleSum += 45;
                }
                angleSum += 270;
                count++;
            }
            const angle = angleSum / count;

            if (count !== 0) {
                sendMessage(`{"command": "drive", "angle": ${angle}, "speed": ${speed}}`);
            } else {
                sendMessage(`{"command": "drive", "angle": 0, "speed": 0}`);
            }
        });
    });

    // Event listeners for the turning buttons
    document.getElementById("turnLeftButton").addEventListener("mousedown", () => {
        sendMessage(`{"command": "turn", "direction": "left", "speed": ${document.getElementById("speedRemoteControlInput").value}}`);
    });
    document.getElementById("turnLeftButton").addEventListener("mouseup", () => {
        sendMessage(`{"command": "turn", "direction": "left", "speed": 0}`);
    });

    document.getElementById("turnRightButton").addEventListener("mousedown", () => {
        sendMessage(`{"command": "turn", "direction": "right", "speed": ${document.getElementById("speedRemoteControlInput").value}}`);
    });
    document.getElementById("turnRightButton").addEventListener("mouseup", () => {
        sendMessage(`{"command": "turn", "direction": "right", "speed": 0}`);
    });

    // Event listeners for keys getting pressed and released
    if (!remoteControlEventListenersAdded) {
        const keyState = {};
        document.addEventListener("keydown", (event) => {
            if (!keyState[event.key] && document.activeElement.id !== "consoleInput") {
                keyState[event.key] = true;
                handleKeyDown(event.key);
            }
        });
        document.addEventListener("keyup", (event) => {
            if (keyState[event.key] && document.activeElement.id !== "consoleInput") {
                keyState[event.key] = false;
                handleKeyUp(event.key);
            }
        });
    }

    remoteControlEventListenersAdded = true;
}

function handleKeyDown(key) {
    if (mode !== "Remote-Control") return;
    switch (key.toLowerCase()) {
        case "q":
            document.getElementById("turnLeftButton").dispatchEvent(new Event('mousedown'));
            break;
        case "e":
            document.getElementById("turnRightButton").dispatchEvent(new Event('mousedown'));
            break;
        case "w":
            if (!document.getElementById("forwardRemoteControlCheckbox").checked) document.getElementById("forwardRemoteControlCheckbox").click()
            break;
        case "d":
            if (!document.getElementById("rightRemoteControlCheckbox").checked) document.getElementById("rightRemoteControlCheckbox").click()
            break;
        case "s":
            if (!document.getElementById("backwardRemoteControlCheckbox").checked) document.getElementById("backwardRemoteControlCheckbox").click()
            break;
        case "a":
            if (!document.getElementById("leftRemoteControlCheckbox").checked) document.getElementById("leftRemoteControlCheckbox").click()
            break;
    }
}
function handleKeyUp(key) {
    if (mode !== "Remote-Control") return;
    switch (key.toLowerCase()) {
        case "q":
            document.getElementById("turnLeftButton").dispatchEvent(new Event('mouseup'));
            break;
        case "e":
            document.getElementById("turnRightButton").dispatchEvent(new Event('mouseup'));
            break;
        case "w":
            if (document.getElementById("forwardRemoteControlCheckbox").checked) document.getElementById("forwardRemoteControlCheckbox").click()
            break;
        case "d":
            if (document.getElementById("rightRemoteControlCheckbox").checked) document.getElementById("rightRemoteControlCheckbox").click()
            break;
        case "s":
            if (document.getElementById("backwardRemoteControlCheckbox").checked) document.getElementById("backwardRemoteControlCheckbox").click()
            break;
        case "a":
            if (document.getElementById("leftRemoteControlCheckbox").checked) document.getElementById("leftRemoteControlCheckbox").click()
            break;
    }
}