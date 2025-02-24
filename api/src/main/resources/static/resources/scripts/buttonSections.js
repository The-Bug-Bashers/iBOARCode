function showButtons(mode) {
    const buttonsContainer = document.getElementById("buttonsContainer");
    switch (mode) {
        case "Remote-Control":
            buttonsContainer.innerHTML = getRemoteControlContent();
            document.getElementById("forwardCheckbox").checked = false;
            document.getElementById("rightCheckbox").checked = false;
            document.getElementById("backwardCheckbox").checked = false;
            document.getElementById("leftCheckbox").checked = false;
            break;
        case "Move-Motor":
            buttonsContainer.innerHTML = getMoveMotorContent();
            break;
        default:
            buttonsContainer.innerHTML = "";
    }
}

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

function getRemoteControlContent() {
    return `
        <h2>Directions</h2>
        <div id="directionButtons">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="forwardCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p>Forward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="rightCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p>Right</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="backwardCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p>Backward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="leftCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p>Left</p>
            </div>
        </div>
        <h2>Turn</h2>
        <button id="turnLeftButton" class="button">left</button>
        <button id="turnRightButton" class="button">right</button>
        <h2>Speed</h2>
        <form id="speedControlForm">
            <input type="number" min="0" max="100" id="speedControlInput" placeholder="Enter speed here (%)" autocomplete="off">
            <button id="speedControlSubmit" class="button">Send</button>
        </form>
    `;
}

function getMoveMotorContent() {
    return `
        <div class="radio-input">
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
        </div>
    `;
}