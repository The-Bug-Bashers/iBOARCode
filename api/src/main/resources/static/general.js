let ctx;
let combinedChart;

function adjustControlsHeight() {
    const controlsElement = document.getElementById("controls");
    const controlsContainer = document.getElementById("controlsContainer");

    const otherElementsHeight = document.getElementById("controlsHeader").offsetHeight + document.getElementById("modeSelect").offsetHeight + convertToPx(1, "vh");
    controlsElement.style.height = null;
    controlsContainer.style.height = null;
    controlsElement.querySelectorAll("*").forEach(el => el.classList.add("hidden"));

    const intendedHeight = controlsElement.clientHeight - convertToPx(1, "em");
    controlsElement.style.height = intendedHeight + "px";

    const intendedContainerHeight = intendedHeight - otherElementsHeight;
    controlsContainer.style.height = intendedContainerHeight + "px";

    controlsElement.querySelectorAll("*").forEach(el => el.classList.remove("hidden"));
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
    // Find the existing script tag
    const oldScript = document.querySelector(`script[src="${scriptSrc}"]`);

    if (oldScript) {
        oldScript.remove(); // Remove the old script
    }

    // Create a new script element
    const newScript = document.createElement("script");
    newScript.src = scriptSrc;
    newScript.defer = true;

    // Append the new script to the head
    document.head.appendChild(newScript);
}

function switchFocus(event) {
    if (event.target.checked) {
        console.log("Switching focus to motors");
        document.getElementById("smallDisplayBox").innerHTML = `
            <h1>LiDAR</h1>
            <div id="lidarCanvas"></div>
        `
        document.getElementById("bigDisplayBox").innerHTML = `
            <h1>Motors</h1>
            <canvas id="combinedChart"></canvas>
        `
    } else {
        console.log("Switching focus to lidar");
        document.getElementById("bigDisplayBox").innerHTML = `
            <h1>LiDAR</h1>
            <div id="lidarCanvas"></div>
        `
        document.getElementById("smallDisplayBox").innerHTML = `
            <h1>Motors</h1>
            <canvas id="combinedChart"></canvas>
        `
    }
    reloadScript("resources/scripts/jsDelivr-chartLibrary.js");
    reloadScript("resources/scripts/motorsSection.js");
}

document.addEventListener("DOMContentLoaded", () => {
    const autoRefreshCheckbox = document.getElementById("autoRefreshCheckbox");
    autoRefreshCheckbox.checked = false;

    autoRefreshCheckbox.addEventListener("change", (event) => {
        if (event.target.checked) {
            dataSocket = new WebSocket(dataSocketURL);
            addDataSocketEventListeners();
            addMotorRendererDataSocketListener();
        } else {
            dataSocket.close();
        }
    });


    const motorsFocusCheckbox = document.getElementById("motorsFocusCheckbox");
    motorsFocusCheckbox.checked = false;

    motorsFocusCheckbox.addEventListener("change", (event) => {
        switchFocus(event);
    });

    adjustControlsHeight();
    window.addEventListener('resize', debounce(adjustControlsHeight, 100));
})