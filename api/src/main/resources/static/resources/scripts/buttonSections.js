document.getElementById("buttonsSelect").value = "Please select";
document.getElementById("buttonsSelect").addEventListener("change", (event) => {
    const mode = event.target.value;
    sendMessage(`{"command": "changeMode", "mode": "${mode}"}`);
    showButtons(mode);

    const placeholder = document.getElementById("placeholder");
    if (placeholder) placeholder.remove();

    addRemoteControlEventListeners();
});

document.addEventListener("keydown", (event) => {
    if (event.key === "w" || event.key === "W") {
        console.log("The 'w' key was pressed.");
    }
});

function showButtons(mode) {
    const buttonsContainer = document.getElementById("buttonsContainer");
    switch (mode) {
        case "Remote-Control":
            buttonsContainer.innerHTML = getRemoteControlContent();
            document.getElementById("forwardRemoteControlCheckbox").checked = false;
            document.getElementById("rightRemoteControlCheckbox").checked = false;
            document.getElementById("backwardRemoteControlCheckbox").checked = false;
            document.getElementById("leftRemoteControlCheckbox").checked = false;
            document.getElementById("speedRemoteControlInput").value = 50;
            break;
        case "Move-Motor":
            buttonsContainer.innerHTML = getMoveMotorContent();
            document.getElementById("value-1").checked = true;
            document.getElementById("forwardMoveMotorCheckbox").checked = false;
            document.getElementById("backwardMoveMotorCheckbox").checked = false;
            document.getElementById("highMoveMotorInput").value = 0;
            document.getElementById("lowMoveMotorInput").value = 10;
            document.getElementById("speedMoveMotorInput").value = 50;
            break;
        default:
            buttonsContainer.innerHTML = "";
    }
}

function getRemoteControlContent() {
    return `
        <h2>Directions</h2>
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
        <h2>Turn</h2>
        <button id="turnLeftButton" class="button">left</button>
        <button id="turnRightButton" class="button">right</button>
        <h2>Speed</h2>
        <div id="speedRemoteControlForm">
            <input type="number" min="0" max="100" id="speedRemoteControlInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
        </div>
    `;
}

function addRemoteControlEventListeners() {
    
    // Event listener for the direction buttons
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
}

function getMoveMotorContent() {
    return `
        <form class="radio-input">
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
        <form id="speedMoveMotorForm">
            <input type="number" min="0" max="100" id="speedMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
        </form>
        <div id="directionMoveMotorButtons" class="buttonPlusLabel">
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
        <input type="number" min="-100" max="100" id="highMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
        <input type="number" min="-100" max="100" id="lowMoveMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
        <h3>Patterns</h3>
        <div class="buttonPlusLabel">
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