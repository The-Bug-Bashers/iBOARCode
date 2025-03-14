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
    })

    adjustControlsHeight();
    window.addEventListener('resize', debounce(adjustControlsHeight, 100));
})