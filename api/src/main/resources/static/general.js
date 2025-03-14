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
})