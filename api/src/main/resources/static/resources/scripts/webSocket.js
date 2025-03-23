const hostname = window.location.hostname.split(':')[0]
const commandSocketURL = `ws://${hostname}:8080/commands`;
const dataSocketURL = `ws://${hostname}:8080/data`;

let commandSocket = new WebSocket(commandSocketURL);
let dataSocket;

// Displays the message in the console
function showMessage(message, received, error, info) {
    const container = document.getElementById("consoleOutput");
    const messageElement = document.createElement("div");
    messageElement.textContent = message;
    messageElement.classList.add("message");

    if (received) {
        if (error) {
            messageElement.classList.add("errorMessage");
        } else if (info) {
            messageElement.classList.add("infoMessage");
        } else {
            messageElement.classList.add("receivedMessage");
        }
    } else {
        messageElement.classList.add("sentMessage");
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
        showMessage("You've asked for help!", true, false, true);
        showMessage("This web interface sends and receives data via WebSockets a REST API.", true, false, true);
        showMessage("The REST API then sends valid commands to an internal messaging server (MQTT).", true, false, true);
        showMessage("The web interface is connected to 2 WebSockets: command, which handles commands, and data, which handles incoming sensor data.", true, false, true);

        let message = "You can use certain commands to change the behaviour of the web interface. Those are: ";
        getCommandList().forEach((command) => {
            message += `"${command}", `;
        });
        message = message.slice(0, -2);
        showMessage(message, true, false, true);
        
        showMessage("All other commands get sent to the REST API and need to be formatted in JSON.", true, false, true);
    } else if (command === "socket connect commands") {
        if (commandSocket.readyState === WebSocket.OPEN) {
            showMessage("You're already connected to the CommandSocket.", true, true, false);
        } else {
            commandSocket = new WebSocket(commandSocketURL);
            addCommandSocketEventListeners();
        }
    } else if (command === "socket connect data") {
        if (dataSocket.readyState === WebSocket.OPEN) {
            showMessage("You're already connected to the DataSocket.", true, true, false);
        } else {
            dataSocket = new WebSocket(dataSocketURL);
            addDataSocketEventListeners();
        }
    } else if (command === "socket status") {
        let commandSocketStatus = false;
        let dataSocketStatus = false;
        if(commandSocket) {commandSocketStatus = commandSocket.readyState === WebSocket.OPEN}
        if (dataSocket) {dataSocketStatus = dataSocket.readyState === WebSocket.OPEN}

        showMessage("CommandSocket connected: " + commandSocketStatus, true, false, true);
        showMessage("DataSocket connected: " + dataSocketStatus, true, false, true);
    } else {
        showMessage("There was a program-intern error with recognizing the command.", true, true, false);
    }
}

// Clears the console
function clearConsole() {
    document.getElementById("consoleOutput").innerHTML = "";
}

function showAvailableCommands() {
    let message = "Available commands: ";
    getCommandList().forEach((command) => {
        message += `"${command}", `;
    });
    message = message.slice(0, -2);
    showMessage(message, true, false, true);
}


// Sends a message to the WebSocket server
function sendMessage(message) {
    showMessage(message, false, false, false);
    document.getElementById("consoleInput").value = ""; // Clear the input field

    if (getCommandList().includes(message)) {
        executeCommand(message);
    } else {
        try {
            commandSocket.send(message);
        } catch (error) {
            showMessage(`An error occurred: ${error}`, true, true, false);
        }
    }
}

// Event listeners
function addCommandSocketEventListeners() {
    // Event listener for when the connection is open
    commandSocket.addEventListener('open', () => {
        showMessage("Connection to CommandSocket established.", true, false, true);
        sendMessage("{\"command\": \"changeMotorState\", \"state\": \"disabled\"}"); // Disable motors upon the new Command socket connection
    });

    // Event listener for when a message is received
    commandSocket.addEventListener('message', (event) => {
        showMessage(event.data.replace(/^Error: /, ''), true, event.data.startsWith("Error: "), false);
    });

    // Event listener for when the connection is closed
    commandSocket.addEventListener('close', () => {
        showMessage("Connection to CommandSocket closed.", true, true, false);
    });

    // Event listener for errors
    commandSocket.addEventListener('error', (error) => {
        showMessage(`An error occurred with CommandSocket: ${error}`, true, true, false);
        console.error('CommandSocket error:', error);
    });
}

function addDataSocketEventListeners() {
    // Event listener for when the connection is open
    dataSocket.addEventListener('open', () => {
        showMessage("Connection to DataSocket established.", true, false, true);
    });
    
    // Event listener for when a message is received
    dataSocket.addEventListener('message', (event) => {
        console.log(event.data);
    });

    // Event listener for when the connection is closed
    dataSocket.addEventListener('close', () => {
        showMessage("Connection to DataSocket closed.", true, true, false);
    });

    // Event listener for errors
    dataSocket.addEventListener('error', (error) => {
        showMessage(`An error occurred with DataSocket: ${error}`, true, true, false);
        console.error('DataSocket error:', error);
    });
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