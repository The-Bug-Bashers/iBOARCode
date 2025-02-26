document.getElementById("buttonsSelect").value = "Please select";
document.getElementById("buttonsSelect").addEventListener("change", (event) => {
    const mode = event.target.value;
    sendMessage(`{"command": "changeMode", "mode": "${mode}"}`);
    showButtons(mode);

    const placeholder = document.getElementById("placeholder");
    if (placeholder) {
        placeholder.remove();
    }
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
            document.getElementById("speedMoveMotorInput").value = 50;
            break;
        default:
            buttonsContainer.innerHTML = "";
    }
}

function getRemoteControlContent() {
    return `
        <h2>Directions</h2>
        <div id="directionRemoteControlButtons">
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
            <input type="number" min="0" max="100" id="speedRemoteControlInput" placeholder="Enter speed here (%)" autocomplete="off">
        </div>
    `;
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
            <input type="number" min="0" max="100" id="speedMoveMotorInput" placeholder="Enter speed here (%)" autocomplete="off">
        </form>
        <div id="directionMoveMotorButtons">
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
    `;
}