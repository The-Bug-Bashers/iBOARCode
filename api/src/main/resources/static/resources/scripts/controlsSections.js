let mode;

document.getElementById("modeSelect").value = "Please select";
document.getElementById("modeSelect").addEventListener("change", (event) => {
    mode = event.target.value;
    sendMessage(`{"command": "changeMode", "mode": "${mode}"}`);
    showControls(mode);

    const placeholder = document.getElementById("placeholder");
    if (placeholder) placeholder.remove();

});

function showControls(mode) {
    const controlsContainer = document.getElementById("controlsContainer");
    switch (mode) {
        case "Remote-Control":
            controlsContainer.innerHTML = getRemoteControlContent();
            document.querySelectorAll('#controlsContainer input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            document.getElementById("speedRemoteControlInput").value = 50;
            addRemoteControlEventListeners();
            break;
        case "Move-Motor":
            controlsContainer.innerHTML = getMoveMotorContent();
            document.getElementById("value-1").checked = true;
            document.querySelectorAll('#controlsContainer input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            document.getElementById("highMoveMotorInput").value = 100;
            document.getElementById("lowMoveMotorInput").value = 0;
            document.getElementById("timeMoveMotorInput").value = 5;
            document.getElementById("speedMoveMotorInput").value = 50;
            addMoveMotorEventListeners();
            break;
        default:
            controlsContainer.innerHTML = "";
    }
}

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

function addRemoteControlEventListeners() {
    
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

function addMoveMotorEventListeners() {
    // Event listener for direction move motor buttons
    document.querySelectorAll('.moveMotorSelectors input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {

            if (event.target.checked) {
                document.querySelectorAll('.moveMotorSelectors input[type="checkbox"]').forEach(checkbox => {
                    if (checkbox !== event.target) {
                        checkbox.checked = false;
                    }
                });
            }

            sendMoveMotorMessage();
        });
    });

    // Event listener for move motor motor selector
    document.getElementById("moveMotorMotorSelector").addEventListener("change", () => {
        sendMoveMotorMessage();
    });
}

function sendMoveMotorMessage() {
    const speed = document.getElementById("speedMoveMotorInput").value;
    const selectedMotor = parseInt(document.querySelector('input[name="value-radio"]:checked').value.split('-')[1], 10);
    const paternHighSpeed = document.getElementById("highMoveMotorInput").value;
    const paternLowSpeed = document.getElementById("lowMoveMotorInput").value;
    const time= document.getElementById("timeMoveMotorInput").value;

    if (document.getElementById("SineMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sine", "highSpeed": ${paternHighSpeed}, "lowSpeed": ${paternLowSpeed}}`);
    } else if (document.getElementById("TriangleMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "triangle", "highSpeed": ${paternHighSpeed}, "lowSpeed": ${paternLowSpeed}}`);
    } else if (document.getElementById("SquareMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "square", "highSpeed": ${paternHighSpeed}, "lowSpeed": ${paternLowSpeed}}`);
    } else if (document.getElementById("SawtoothMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sawtooth", "highSpeed": ${paternHighSpeed}, "lowSpeed": ${paternLowSpeed}}`);
    } else if (document.getElementById("forwardMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "speed": ${speed}}`);
    } else if (document.getElementById("backwardMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "speed": -${speed}}`);
    } else {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "speed": 0}`);
    }
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

function getMoveMotorContent() {
    return `
        <form class="radio-input" id="moveMotorMotorSelector">
            <label>
                <input type="radio" id="value-1" name="value-radio" value="value-1" />
                <span>1</span>
            </label>
            <label>
                <input type="radio" id="value-2" name="value-radio" value="value-2" />
                <span>2</span>
            </label>
            <label>
                <input type="radio" id="value-3" name="value-radio" value="value-3" />
                <span>3</span>
            </label>
            <span class="selection"></span>
        </form>
        <h2>Normal-move</h2>
        <div class="inputPlusLabel">
            <h4>Speed</h4>
            <div class="inputBorder" style="width: fit-content;">
                <input type="number" min="0" max="100" id="speedMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div id="directionMoveMotorButtons" class="buttonPlusLabel moveMotorSelectors">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="forwardMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('forwardMoveMotorCheckbox').click()">Forward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="backwardMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('backwardMoveMotorCheckbox').click()">Backward</p>
            </div>
        </div>
        <h2>Pattern-move</h2>
        <div class="inputPlusLabel">
            <h4>High speed</h4>
            <div class="inputBorder">
                <input type="number" min="-100" max="100" id="highMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>Low speed</h4>
            <div class="inputBorder">
                <input type="number" min="-100" max="100" id="lowMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>Time</h4>
            <div class="inputBorder">
                <input type="number" min="0" max="60" id="timeMoveMotorInput" class="numberRange" placeholder="Time here (sec)" autocomplete="off">
            </div>
        </div>
        <h3>Patterns</h3>
        <div id="patternMoveMotorButtons" class="buttonPlusLabel moveMotorSelectors">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SineMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SineMoveMotorCheckbox').click()">Sine</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="TriangleMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('TriangleMoveMotorCheckbox').click()">Triangle</p>
            </div>
             <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SquareMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SquareMoveMotorCheckbox').click()">Square</p>
            </div>
             <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SawtoothMoveMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SawtoothMoveMotorCheckbox').click()">Sawtooth</p>
            </div>
        </div>
    `;
}