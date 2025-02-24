const socketURL = 'wss://ws.ifelse.io';
let socket = new WebSocket(socketURL);

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
    return ["clear", "disconnect", "help", "connect"];
}

// Checks if the message is a command
function checkIfCommand(command) {
    const commandList = getCommandList();
    return commandList.includes(command);
}

// Executes the command
function executeCommand(command) {
    if (command === "clear") {
        clearConsole();
    } else if (command === "disconnect") {
        socket.close();
    } else if (command === "help") {
        showMessage("You've asked for help!", true, false, true);
        showMessage("This is a simple WebSocket console that sends messages to the BOAR server.", true, false, true);
        showMessage("You can send a message by entering it into the text field and pressing ENTER or the button.", true, false, true);
        showMessage("There are also some commands available to control the console.", true, false, true);
        showAvailableCommands();
    } else if (command === "connect") {
        if (socket.readyState === WebSocket.OPEN) {
            showMessage("You're already connected to the server.", true, true, false);
        } else {
            socket = new WebSocket(socketURL);
            addEventListeners();
        }
    } else {
        showMessage("There was a program-intern error with recognizing the command.", true, true, false);
    }
}

// Clears the console
function clearConsole() {
    document.getElementById("consoleOutput").innerHTML = "";
}

function showAvailableCommands() {
    const commands = getCommandList();
    let message = "Available commands: ";
    commands.forEach((command) => {
        message += `"${command}", `;
    });
    message = message.slice(0, -2);
    showMessage(message, true, false, true);
}


// Sends a message to the WebSocket server
function sendMessage(message) {
    showMessage(message, false, false, false);
    document.getElementById("consoleInput").value = ""; // Clear the input field

    if (checkIfCommand(message)) {
        executeCommand(message);
    } else {
        socket.send(message);
    }
}

// Event listeners
function addEventListeners() {
    // Event listener for when the connection is open
    socket.addEventListener('open', () => {
        console.log('WebSocket connection established.');
        showMessage("Connection established.", true, false, true);
    });

    // Event listener for when a message is received
    socket.addEventListener('message', (event) => {
        showMessage(event.data, true, false, false);
    });

    // Event listener for when the connection is closed
    socket.addEventListener('close', () => {
        showMessage("Connection closed.", true, true, false);
    });

    // Event listener for errors
    socket.addEventListener('error', (error) => {
        showMessage(`An error occurred: ${error}`, true, true, false);
        console.error('WebSocket error:', error);
    });
}

addEventListeners();

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