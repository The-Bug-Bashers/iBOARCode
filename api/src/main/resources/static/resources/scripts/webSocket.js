const hostname = window.location.hostname.split(':')[0]
const commandSocketURL = `ws://${hostname}:8080/commands`;
const dataSocketURL = `ws://${hostname}:8080/data`;

let commandSocket = new WebSocket(commandSocketURL);
let dataSocket;

// Displays the message in the console
function showMessage(message, type) {
    const container = document.getElementById("consoleOutput");
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.classList.add("message");

    switch (type) {
        case "sent":
            messageElement.classList.add("sentMessage");
            break;
        case "error":
            messageElement.classList.add("errorMessage");
            messageElement.classList.add("receivedMessage");
            console.error(message);
            break;
        case "info":
            messageElement.classList.add("infoMessage");
        case "received":
            messageElement.classList.add("receivedMessage");
            break;
        default:
            console.error("Wrong message type: " + type);
    }

    container.appendChild(messageElement);
    scrollDownInConsole();
}

// Command handling

// Returns a list of available commands
function getCommandList() {
    return ["clear", "help",  "socket connect commands", "socket connect data", "socket disconnect commands", "socket disconnect data", "socket status",];
}

// Executes the command
function executeCommand(command) {
    if (command === "clear") {
        clearConsole();
    } else if (command === "socket disconnect commands") {
        commandSocket.close();
    } else if (command === "socket disconnect data") {
        dataSocket.close();
    } else if (command === "help") {
        showMessage("You've asked for help!", "info");
        showMessage("This web interface sends and receives data via WebSockets a REST API.", "info");
        showMessage("The REST API then sends valid commands to an internal messaging server (MQTT).", "info");
        showMessage("The web interface is connected to 2 WebSockets: command, which handles commands, and data, which handles incoming sensor data.", "info");

        let message = "You can use certain commands to change the behaviour of the web interface. Those are: ";
        getCommandList().forEach((command) => {
            message += `"${command}", `;
        });
        message = message.slice(0, -2);
        showMessage(message, "info");

        showMessage("All other commands get sent to the REST API and need to be formatted in JSON.", "info");
    } else if (command === "socket connect commands") {
        if (commandSocket.readyState === WebSocket.OPEN) {
            showMessage("You're already connected to the CommandSocket.", "error");
        } else {
            commandSocket = new WebSocket(commandSocketURL);
            addCommandSocketEventListeners();
        }
    } else if (command === "socket connect data") {
        if (dataSocket.readyState === WebSocket.OPEN) {
            showMessage("You're already connected to the DataSocket.", "error");
        } else {
            dataSocket = new WebSocket(dataSocketURL);
            addDataSocketEventListeners();
        }
    } else if (command === "socket status") {
        let commandSocketStatus = false;
        let dataSocketStatus = false;
        if(commandSocket) {commandSocketStatus = commandSocket.readyState === WebSocket.OPEN}
        if (dataSocket) {dataSocketStatus = dataSocket.readyState === WebSocket.OPEN}

        showMessage("CommandSocket connected: " + commandSocketStatus, "info");
        showMessage("DataSocket connected: " + dataSocketStatus, "info");
    } else {
        showMessage("There was a program-intern error with recognizing the command.", "error");
    }
}

// Clears the console
function clearConsole() {
    document.getElementById("consoleOutput").innerHTML = "";
}


// Sends a message to the WebSocket server
function sendMessage(message) {
    showMessage(message, "sent");
    document.getElementById("consoleInput").value = ""; // Clear the input field

    if (getCommandList().includes(message)) {
        executeCommand(message);
    } else {
        try {
            commandSocket.send(message);
        } catch (error) {
            showMessage(`An error occurred: ${error}`, "error");
        }
    }
}

// Event listeners
function addCommandSocketEventListeners() {
    // Event listener for when the connection is open
    commandSocket.addEventListener('open', () => {
        showMessage("Connection to CommandSocket established.", "info");
        sendMessage("{\"command\": \"changeMotorState\", \"state\": \"disabled\"}"); // Disable motors upon the new Command socket connection
        sendMessage("{\"command\": \"changeLidarState\", \"state\": \"disabled\"}"); // Disable lidar upon the new Command socket connection
    });

    // Event listener for when a message is received
    commandSocket.addEventListener('message', (event) => {
        if (event.data.startsWith("Error: ")) {
            showMessage(event.data.replace(/^Error: /, ''), "error");
        } else {
            showMessage(event.data, "received");
        }
    });

    // Event listener for when the connection is closed
    commandSocket.addEventListener('close', () => {
        showMessage("Connection to CommandSocket closed.", "error");
    });

    // Event listener for errors
    commandSocket.addEventListener('error', (error) => {
        showMessage(`An error occurred with CommandSocket: ${error}`, "error");
        console.error('CommandSocket error:', error);
    });
}

function addDataSocketEventListeners() {
    dataSocket.addEventListener('open', () => {
        showMessage("Connection to DataSocket established.", "info");
    });

    dataSocket.addEventListener('close', () => {
        showMessage("Connection to DataSocket closed.", "error");
    });

    dataSocket.addEventListener('error', (error) => {
        showMessage(`An error occurred with DataSocket: ${error}`, "error");
        console.error('DataSocket error:', error);
    });

    dataSocket.onmessage = function (event) {
        const data = JSON.parse(event.data);

        if (data.lidarScan) {
            processLidarData(data.lidarScan);
        } else if (data.navigationData) {
            processNavigationData(data.navigationData);
        } else if (data.motorData) {
            processMotorData(data.motorData);
        } else {
            showMessage("Received data on dataSocket could not get parsed: " + data, "error");
        }
    };
}

addCommandSocketEventListeners();

function scrollDownInConsole() {
    const element = document.getElementById("consoleOutput");
    element.scrollTop = element.scrollHeight;
}

// Event listener for the form submission
document.getElementById("consoleTextField").addEventListener("submit", (event) => {
    event.preventDefault();
    const message = document.getElementById("consoleInput").value;
    sendMessage(message);
});