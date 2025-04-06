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
                    <input type="number" min="0" max="360" id="staticRestrictionZoneSimpleNavigateInput" class="numberRange" placeholder="100" autocomplete="off">
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
                    <input type="number" min="0" max="500" id="bufferDistanceSimpleNavigateInput" class="numberRange" placeholder="2" autocomplete="off">
                </div>
            </div>
            <div class="inputPlusLabel">
                <h4>Scan Buffer distance (cm)</h4>
                <div class="inputBorder">
                    <input type="number" min="0" max="500" id="scanBufferDistanceSimpleNavigateInput" class="numberRange" placeholder="4" autocomplete="off">
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
                    <input class="custom-checkbox" checked="" type="checkbox" id="recalculateIfFinishedDrivingToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('recalculateIfFinishedDrivingToggle').click()">prevent recalculate heading until finished driving</p>
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

function addSimpleNavigateCode() {
    const knob = document.getElementById("knob");
    const dial = document.getElementById("dial");
    const angleDisplay = document.getElementById("angle-display");
    const radius = 100; // Radius of the dial

    const targetDirectionInput = document.getElementById("targetDirectionSimpleNavigateInput");
    const staticRestrictionZoneInput = document.getElementById("staticRestrictionZoneSimpleNavigateInput");
    const dynamicRestrictionZoneInput = document.getElementById("dynamicRestrictionZoneSimpleNavigateInput");
    const bufferDistanceInput = document.getElementById("bufferDistanceSimpleNavigateInput");
    const scanBufferDistanceInput = document.getElementById("scanBufferDistanceSimpleNavigateInput");
    const maxSpeedInput = document.getElementById("maxSpeedSimpleNavigateInput");
    const recalculateIfFinishedDrivingToggle = document.getElementById("recalculateIfFinishedDrivingToggle");
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
        "recalculateIfFinishedDriving": ${recalculateIfFinishedDrivingToggle.checked}, 
        "targetDirection": ${targetDirectionInput.value}, 
        "staticRestrictionZone": ${staticRestrictionZoneInput.value}, 
        "dynamicRestrictionZone": ${dynamicRestrictionZoneInput.value}, 
        "bufferDistance": ${bufferDistanceInput.value}, 
        "scanBufferDistance": ${scanBufferDistanceInput.value}, 
        "maxSpeed": ${maxSpeedInput.value}, 
        "state": "${state}"}`);
    }

    // Set default values
    setKnobPosition(0);
    targetDirectionInput.value = 0;
    staticRestrictionZoneInput.value = 110;
    dynamicRestrictionZoneInput.value = 60;
    bufferDistanceInput.value = 2;
    scanBufferDistanceInput.value = 4;
    maxSpeedInput.value = 30;
    enableToggle.checked = false;
}