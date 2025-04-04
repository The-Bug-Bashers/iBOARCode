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
            document.getElementById("speedRemoteControlInput").value = 30;
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