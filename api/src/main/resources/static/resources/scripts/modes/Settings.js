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
                    <input class="custom-checkbox" checked="" type="checkbox" id="hideLidarDataToggle">
                    <span class="checkmark"></span>
                </label>
                <p onclick="document.getElementById('hideLidarDataToggle').click()">Hide lidar data</p>
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

function addSettingsCode() {
    const enableLockedLidarZoomToggle = document.getElementById("enableLockedLidarZoomSettingsToggle");
    const lockedLidarZoomInput = document.getElementById("lidarZoomSettingsInput");
    const hideMotorDataToggle = document.getElementById("hideMotorDataSettingsToggle");
    const hideLidarDataToggle = document.getElementById("hideLidarDataToggle");

    // Set default values
    lockedLidarZoomInput.value = lockLidarZoomValue;
    enableLockedLidarZoomToggle.checked = lockLidarZoom;
    hideMotorDataToggle.checked = hideMotorData;
    hideLidarDataToggle.checked = !showLidarData;
    
    enableLockedLidarZoomToggle.addEventListener("change", () => {
        lockLidarZoom = enableLockedLidarZoomToggle.checked;
    });
    
    lockedLidarZoomInput.addEventListener("input", () => {
        lockLidarZoomValue = lockedLidarZoomInput.value;
    });
    
    hideMotorDataToggle.addEventListener("change", () => {
        hideMotorData = hideMotorDataToggle.checked;
    });

    hideLidarDataToggle.addEventListener("change", () => {
        showLidarData = !hideLidarDataToggle.checked;
    });
}