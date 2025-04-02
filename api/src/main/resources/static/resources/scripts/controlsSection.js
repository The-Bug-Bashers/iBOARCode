let mode;

document.getElementById("modeSelect").value = "Please select";
document.getElementById("modeSelect").addEventListener("change", (event) => {
    mode = event.target.value;
    showControls(mode);

    adjustControlsHeight();

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
            sendMessage(`{"command": "changeMode", "mode": "remoteControl"}`);
            addRemoteControlCode();
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
            sendMessage(`{"command": "changeMode", "mode": "moveMotor"}`);
            addMoveMotorCode();
            break;
        case "Simple-Navigate":
            controlsContainer.innerHTML = getSimpleNavigateContent();
            sendMessage(`{"command": "changeMode", "mode": "simpleNavigate"}`);
            addSimpleNavigateCode();
            break;
            case "Debug-Navigate":
            controlsContainer.innerHTML = getDebugNavigateContent();
            sendMessage(`{"command": "changeMode", "mode": "debugNavigate"}`);
            addDebugNavigationCode();
            break;
        case "Settings":
            controlsContainer.innerHTML = getSettingsContent();
            addSettingsCode();
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

function addMoveMotorCode() {
    // Event listener for the direction move motor buttons
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

function addSimpleNavigateCode() {
    const knob = document.getElementById("knob");
    const dial = document.getElementById("dial");
    const angleDisplay = document.getElementById("angle-display");
    const radius = 100; // Radius of the dial

    const targetDirectionInput = document.getElementById("targetDirectionSimpleNavigateInput");
    const staticRestrictionZoneInput = document.getElementById("staticRestrictionZoneSimpleNavigateInput");
    const dynamicRestrictionZoneInput = document.getElementById("dynamicRestrictionZoneSimpleNavigateInput");
    const bufferDistanceInput = document.getElementById("bufferDistanceSimpleNavigateInput");
    const maxSpeedInput = document.getElementById("maxSpeedSimpleNavigateInput");
    const enableToggle = document.getElementById("enableSimpleNavigateToggle");

    function setKnobPosition(angle) {
        let radians = (angle - 90) * (Math.PI / 180); // Offset by -90° to put 0° at the top
        let x = Math.cos(radians) * (radius - 10) + radius;
        let y = Math.sin(radians) * (radius - 10) + radius;
        knob.style.left = `${x - 10}px`;
        knob.style.top = `${y - 10}px`;
    }

    function getAngle(x, y) {
        const boundingClient = dial.getBoundingClientRect();
        const dx = x - (boundingClient.left + boundingClient.width / 2);
        const dy = y - (boundingClient.top + boundingClient.height / 2);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90; // Offset by +90°
        return (angle + 360) % 360;
    }

    knob.addEventListener("mousedown", () => {
        function onMouseMove(event) {
            let angle = getAngle(event.clientX, event.clientY);
            setKnobPosition(angle);
            angleDisplay.innerText = `${Math.round(angle)}°`;
            targetDirectionInput.value = Math.round(angle);
        }

        function onMouseUp() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    });

    // Event listener for target direction input
    targetDirectionInput.addEventListener("input", (event) => {
        let angle = parseFloat(event.target.value);

        if ((angle || angle === 0) && angle <= 360 && angle >= 0) {
            setKnobPosition(angle);
            angleDisplay.innerText = `${Math.round(angle)}°`;
        }
    });

    // Event listener for enable toggle
    enableToggle.addEventListener("change", () => {
        sendAPIMessage();
    });
    
    // Event listener for all inputs
    document.querySelectorAll('#simpleNavigateInputs input').forEach(input => {
        input.addEventListener('input', () => {
            if (enableToggle.checked) {
                enableToggle.checked = false;
                sendAPIMessage();
            }
        });
    });

    function sendAPIMessage() {
        const state = enableToggle.checked ? "enabled" : "disabled";
        sendMessage(`{"command": "simpleNavigate", 
        "targetDirection": ${targetDirectionInput.value}, 
        "staticRestrictionZone": ${staticRestrictionZoneInput.value}, 
        "dynamicRestrictionZone": ${dynamicRestrictionZoneInput.value}, 
        "bufferDistance": ${bufferDistanceInput.value}, 
        "maxSpeed": ${maxSpeedInput.value}, 
        "state": "${state}"}`);
    }

    // Set default values
    setKnobPosition(0);
    targetDirectionInput.value = 0;
    staticRestrictionZoneInput.value = 45;
    dynamicRestrictionZoneInput.value = 30;
    bufferDistanceInput.value = 5;
    maxSpeedInput.value = 30;
    enableToggle.checked = false;
}

function addDebugNavigationCode() {
    const showMaxFrontDistanceToggle = document.getElementById("showMaxFrontDistanceToggle");
    const driveToMaxFrontDistanceToggle = document.getElementById("driveToMaxFrontDistanceToggle");

    const showFurthestDistanceToggle = document.getElementById("showFurthestDistanceToggle");
    const driveToFurthestDistanceToggle = document.getElementById("driveToFurthestDistanceToggle");
    
    const bufferInput = document.getElementById("bufferDriveToMaxFrontDistanceInput");
    const maxSpeedInput = document.getElementById("maxSpeedDriveToMaxFrontDistanceInput");
    
    showMaxFrontDistanceToggle.checked = false;
    driveToMaxFrontDistanceToggle.checked = false;
    showFurthestDistanceToggle.checked = false;
    driveToFurthestDistanceToggle.checked = false;
    bufferInput.value = 1;
    maxSpeedInput.value = 100;

    showMaxFrontDistanceToggle.addEventListener("change", () => {
        driveToMaxFrontDistanceToggle.checked = false;
        showFurthestDistanceToggle.checked = false;
        driveToFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugNavigate", "showMaxFrontDistance": ${showMaxFrontDistanceToggle.checked}, "buffer": ${bufferInput.value}}`);
    });
    driveToMaxFrontDistanceToggle.addEventListener("change", () => {
        showMaxFrontDistanceToggle.checked = false;
        showFurthestDistanceToggle.checked = false;
        driveToFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugNavigate", "driveToMaxFrontDistance": ${driveToMaxFrontDistanceToggle.checked}, "buffer": ${bufferInput.value}, "maxSpeed": ${maxSpeedInput.value}}`);
    });
    showFurthestDistanceToggle.addEventListener("change", () => {
        driveToMaxFrontDistanceToggle.checked = false;
        showMaxFrontDistanceToggle.checked = false;
        driveToFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugNavigate", "showFurthestDistance": ${showFurthestDistanceToggle.checked}, "buffer": ${bufferInput.value}}`);
    });
    driveToFurthestDistanceToggle.addEventListener("change", () => {
        driveToMaxFrontDistanceToggle.checked = false;
        showMaxFrontDistanceToggle.checked = false;
        showFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugNavigate", "driveToFurthestDistance": ${driveToFurthestDistanceToggle.checked}, "buffer": ${bufferInput.value}, "maxSpeed": ${maxSpeedInput.value}}`);
    });
}

function addSettingsCode() {
    const enableLockedLidarZoomToggle = document.getElementById("enableLockedLidarZoomSettingsToggle");
    const lockedLidarZoomInput = document.getElementById("lidarZoomSettingsInput");
    const hideMotorDataToggle = document.getElementById("hideMotorDataSettingsToggle");

    // Set default values
    lockedLidarZoomInput.value = lidarZoomValue;
    enableLockedLidarZoomToggle.checked = lockLidarZoom;
    hideMotorDataToggle.checked = hideMotorData;

    // Event listener for locked LiDAR zoom toggle
    enableLockedLidarZoomToggle.addEventListener("change", () => {
        lockLidarZoom = enableLockedLidarZoomToggle.checked;
    });

    // Event listener for locked LiDAR zoom input
    lockedLidarZoomInput.addEventListener("input", () => {
        lidarZoomValue = lockedLidarZoomInput.value;
    });

    // Event listener for hide motor data toggle
    hideMotorDataToggle.addEventListener("change", () => {
        hideMotorData = hideMotorDataToggle.checked;
    });
}

function sendMoveMotorMessage() {
    const speed = document.getElementById("speedMoveMotorInput").value;
    const selectedMotor = parseInt(document.querySelector('input[name="value-radio"]:checked').value.split('-')[1], 10);
    const patternHighSpeed = document.getElementById("highMoveMotorInput").value;
    const patternLowSpeed = document.getElementById("lowMoveMotorInput").value;
    const time= document.getElementById("timeMoveMotorInput").value;

    if (document.getElementById("SineMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sine", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("TriangleMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "triangle", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("SquareMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "square", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("SawtoothMoveMotorCheckbox").checked) {
        sendMessage(`{"command": "moveMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sawtooth", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
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

function getSimpleNavigateContent() {
    return `
        <div class="dial" id="dial">
            <div class="angle-display" id="angle-display">0°</div>
            <div class="knob" id="knob"></div>
        </div>
        <div id="simpleNavigateInputs">
            <div class="inputPlusLabel">
                <h4>Target direction</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="360" id="targetDirectionSimpleNavigateInput" class="numberRange" placeholder="0" autocomplete="off">
                </div>
            </div>
            <div class="inputPlusLabel">
                <h4>Static restriction zone</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="360" id="staticRestrictionZoneSimpleNavigateInput" class="numberRange" placeholder="45" autocomplete="off">
                </div>
            </div>
            <div class="inputPlusLabel">
                <h4>Dynamic restriction zone</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="360" id="dynamicRestrictionZoneSimpleNavigateInput" class="numberRange" placeholder="30" autocomplete="off">
                </div>
            </div>
            <div class="inputPlusLabel">
                <h4>Buffer distance (cm)</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="500" id="bufferDistanceSimpleNavigateInput" class="numberRange" placeholder="5" autocomplete="off">
                </div>
            </div>
            <div class="inputPlusLabel">
                <h4>Max speed (%)</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="100" id="maxSpeedSimpleNavigateInput" class="numberRange" placeholder="5" autocomplete="off">
                </div>
            </div>
        </div>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="enableSimpleNavigateToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('enableSimpleNavigateToggle').click()">Enable</p>
            </div>
        </div>
    `;
}

function getDebugNavigateContent() {
    return `
        <h3>Max front distance</h3>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="showMaxFrontDistanceToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('showMaxFrontDistanceToggle').click()">Display</p>
            </div>
        </div>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="driveToMaxFrontDistanceToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('driveToMaxFrontDistanceToggle').click()">Drive to</p>
            </div>
        </div>
        
        <h3>Furthest distance</h3>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="showFurthestDistanceToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('showFurthestDistanceToggle').click()">Display</p>
            </div>
        </div>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="driveToFurthestDistanceToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('driveToFurthestDistanceToggle').click()">Drive to</p>
            </div>
        </div>
        
        <h3>Parameter</h3>
        <div class="inputPlusLabel">
            <h4>Buffer (cm) </h4>
            <div class="inputBorder">
                <input type="number" min="0" max="500" id="bufferDriveToMaxFrontDistanceInput" class="numberRange" placeholder="5" autocomplete="off">
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>Max Speed (%) </h4>
            <div class="inputBorder">
                <input type="number" min="0" max="100" id="maxSpeedDriveToMaxFrontDistanceInput" class="numberRange" placeholder="30" autocomplete="off">
            </div>
        </div>
    `;
}

function getSettingsContent() {
    return `
        <div class="buttonPlusLabel" style="margin-top: 1vh">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="enableLockedLidarZoomSettingsToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('enableLockedLidarZoomSettingsToggle').click()">Lock LiDAR zoom</p>
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>LiDAR zoom (cm) </h4>
            <div class="inputBorder">
                <input type="number" min="1" max="1500" id="lidarZoomSettingsInput" class="numberRange" placeholder="100" autocomplete="off">
            </div>
        </div>
        <div class="buttonPlusLabel">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="hideMotorDataSettingsToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('hideMotorDataSettingsToggle').click()">Hide motor data</p>
            </div>
        </div>
    `;
}