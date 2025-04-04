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