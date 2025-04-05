function getDebugDistanceContent() {
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

function addDebugDistanceCode() {
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
        sendMessage(`{"command": "debugDistance", "showMaxFrontDistance": ${showMaxFrontDistanceToggle.checked}, "buffer": ${bufferInput.value}}`);
    });
    driveToMaxFrontDistanceToggle.addEventListener("change", () => {
        showMaxFrontDistanceToggle.checked = false;
        showFurthestDistanceToggle.checked = false;
        driveToFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugDistance", "driveToMaxFrontDistance": ${driveToMaxFrontDistanceToggle.checked}, "buffer": ${bufferInput.value}, "maxSpeed": ${maxSpeedInput.value}}`);
    });
    showFurthestDistanceToggle.addEventListener("change", () => {
        driveToMaxFrontDistanceToggle.checked = false;
        showMaxFrontDistanceToggle.checked = false;
        driveToFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugDistance", "showFurthestDistance": ${showFurthestDistanceToggle.checked}, "buffer": ${bufferInput.value}}`);
    });
    driveToFurthestDistanceToggle.addEventListener("change", () => {
        driveToMaxFrontDistanceToggle.checked = false;
        showMaxFrontDistanceToggle.checked = false;
        showFurthestDistanceToggle.checked = false;
        sendMessage(`{"command": "debugDistance", "driveToFurthestDistance": ${driveToFurthestDistanceToggle.checked}, "buffer": ${bufferInput.value}, "maxSpeed": ${maxSpeedInput.value}}`);
    });
}