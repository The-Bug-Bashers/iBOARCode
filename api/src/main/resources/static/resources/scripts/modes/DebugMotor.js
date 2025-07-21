function getDebugMotorContent() {
    return `
        <form class="radio-input" id="debugMotorMotorSelector">
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
                <input type="number" min="0" max="100" id="speedDebugMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div id="directionDebugMotorButtons" class="buttonPlusLabel debugMotorSelectors">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="forwardDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('forwardDebugMotorCheckbox').click()">Forward</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="backwardDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('backwardDebugMotorCheckbox').click()">Backward</p>
            </div>
        </div>
        <h2>Pattern-move</h2>
        <div class="inputPlusLabel">
            <h4>High speed</h4>
            <div class="inputBorder">
                <input type="number" min="-100" max="100" id="highDebugMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>Low speed</h4>
            <div class="inputBorder">
                <input type="number" min="-100" max="100" id="lowDebugMotorInput" class="numberRange" placeholder="Enter speed here (%)" autocomplete="off">
            </div>
        </div>
        <div class="inputPlusLabel">
            <h4>Time</h4>
            <div class="inputBorder">
                <input type="number" min="0" max="60" id="timeDebugMotorInput" class="numberRange" placeholder="Time here (sec)" autocomplete="off">
            </div>
        </div>
        <h3>Patterns</h3>
        <div id="patternDebugMotorButtons" class="buttonPlusLabel debugMotorSelectors">
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SineDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SineDebugMotorCheckbox').click()">Sine</p>
            </div>
            <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="TriangleDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('TriangleDebugMotorCheckbox').click()">Triangle</p>
            </div>
             <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SquareDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SquareDebugMotorCheckbox').click()">Square</p>
            </div>
             <div class="directionButtonPlusLabel">
                <label class="checkbox-container">
                    <input class="custom-checkbox" checked="" type="checkbox" id="SawtoothDebugMotorCheckbox">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('SawtoothDebugMotorCheckbox').click()">Sawtooth</p>
            </div>
        </div>
    `;
}

function addDebugMotorCode() {
    // Event listener for the direction move motor buttons
    document.querySelectorAll('.debugMotorSelectors input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (event) => {

            if (event.target.checked) {
                document.querySelectorAll('.debugMotorSelectors input[type="checkbox"]').forEach(checkbox => {
                    if (checkbox !== event.target) {
                        checkbox.checked = false;
                    }
                });
            }

            sendDebugMotorMessage();
        });
    });

    // Event listener for move motor motor selector
    document.getElementById("debugMotorMotorSelector").addEventListener("change", () => {
        sendDebugMotorMessage();
    });
}

function sendDebugMotorMessage() {
    const speed = document.getElementById("speedDebugMotorInput").value;
    const selectedMotor = parseInt(document.querySelector('input[name="value-radio"]:checked').value.split('-')[1], 10);
    const patternHighSpeed = document.getElementById("highDebugMotorInput").value;
    const patternLowSpeed = document.getElementById("lowDebugMotorInput").value;
    const time= document.getElementById("timeDebugMotorInput").value;

    if (document.getElementById("SineDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sine", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("TriangleDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "triangle", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("SquareDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "square", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("SawtoothDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "time": ${time}, "pattern": "sawtooth", "highSpeed": ${patternHighSpeed}, "lowSpeed": ${patternLowSpeed}}`);
    } else if (document.getElementById("forwardDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "speed": ${speed}}`);
    } else if (document.getElementById("backwardDebugMotorCheckbox").checked) {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "speed": -${speed}}`);
    } else {
        sendMessage(`{"command": "debugMotor", "motor": ${selectedMotor}, "speed": 0}`);
    }
}