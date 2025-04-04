const botSize = 0.256; // in m

let canvas, lidarCtx, centerX, centerY, scale; // Variables for lidarSection.js
let ctx, combinedChart; // Variables for motorsSection.js

// variables for settings.js
let lockLidarZoomValue = 100;
let lockLidarZoom = false;
let hideMotorData = false;

function adjustControlsHeight() {
    const controlsSection = document.getElementById("controls");
    const controlsContent = document.getElementById("controlsContainer");

    const otherSectionsHeight = document.getElementById("controlsHeader").offsetHeight + document.getElementById("modeSelect").offsetHeight + convertToPx(1, "vh");
    controlsSection.style.height = null;
    controlsContent.style.height = null;
    controlsSection.querySelectorAll("*").forEach(element => element.classList.add("hidden"));

    const intendedHeight = controlsSection.clientHeight - convertToPx(1, "em");
    controlsSection.style.height = intendedHeight + "px";

    const intendedContainerHeight = intendedHeight - otherSectionsHeight;
    controlsContent.style.height = intendedContainerHeight + "px";

    controlsSection.querySelectorAll("*").forEach(element => element.classList.remove("hidden"));

    calculateCanvasSize(); // recalculate canvas height after box height change
}

function convertToPx(value, unit) {
    const tempElement = document.createElement("div");

    tempElement.style.height = `${value}${unit}`;
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";

    document.body.appendChild(tempElement);
    const pxValue = tempElement.offsetHeight;
    document.body.removeChild(tempElement);

    return pxValue;
}

function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

function reloadScript(scriptSrc) {
    const oldScript = document.querySelector(`script[src="${scriptSrc}"]`);

    if (oldScript) oldScript.remove();

    const newScript = document.createElement("script");
    newScript.src = scriptSrc;
    newScript.defer = true;

    document.head.appendChild(newScript);
}

function switchFocus(event) {
    if (event.target.checked) {
        document.getElementById("smallDisplayBox").innerHTML = `
            <h1>LiDAR</h1>
            <canvas id="lidarCanvas"></canvas>
        `
        document.getElementById("bigDisplayBox").innerHTML = `
            <h1>Motors</h1>
            <canvas id="combinedChart"></canvas>
        `
    } else {
        document.getElementById("bigDisplayBox").innerHTML = `
            <h1>LiDAR</h1>
            <canvas id="lidarCanvas"></canvas>
        `
        document.getElementById("smallDisplayBox").innerHTML = `
            <h1>Motors</h1>
            <canvas id="combinedChart"></canvas>
        `
    }
    reloadScript("resources/scripts/jsDelivr-chartLibrary.js");
    reloadScript("resources/scripts/motorsSection.js");
    reloadScript("resources/scripts/lidarSection.js");
    initialiseCanvas()
}

document.addEventListener("DOMContentLoaded", () => {
    const autoRefreshCheckbox = document.getElementById("autoRefreshCheckbox");
    autoRefreshCheckbox.checked = false;
    autoRefreshCheckbox.addEventListener("change", (event) => {
        if (event.target.checked) {
            dataSocket = new WebSocket(dataSocketURL);
            addDataSocketEventListeners();
        } else {
            dataSocket.close();
        }
    });
    
    const motorEnableCheckbox = document.getElementById("motorsEnableCheckbox");
    motorEnableCheckbox.checked = false;
    motorEnableCheckbox.addEventListener("change", (event) => {
        let state = "disabled";
        if (event.target.checked) state = "enabled";
        sendMessage("{\"command\": \"changeMotorState\", \"state\": \"" + state + "\"}");
    })

    const lidarEnableCheckbox = document.getElementById("lidarEnableCheckbox");
    lidarEnableCheckbox.checked = false;
    lidarEnableCheckbox.addEventListener("change", (event) => {
        let state = "disabled";
        if (event.target.checked) state = "enabled";
        sendMessage("{\"command\": \"changeLidarState\", \"state\": \"" + state + "\"}");
    })
    
    const motorsFocusCheckbox = document.getElementById("motorsFocusCheckbox");
    motorsFocusCheckbox.checked = false;
    motorsFocusCheckbox.addEventListener("change", (event) => {
        switchFocus(event);
    });

    adjustControlsHeight();
    window.addEventListener('resize', debounce(adjustControlsHeight, 100));
})