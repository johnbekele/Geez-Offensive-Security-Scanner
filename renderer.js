const { ipcRenderer } = require('electron');

function runTest() {
    const target = document.getElementById('target').value;
    const tool = document.getElementById('tool').value;

    if (!target) {
        alert('Please enter a valid IP or website.');
        return;
    }

    document.getElementById('output').innerHTML = `<span style="color: limegreen;">Running ${tool} on ${target}...</span><br><br>`;
    ipcRenderer.send('run-test', tool, target);
}

// Listen for results
ipcRenderer.on('tool-output', (event, data) => {
    const outputElement = document.getElementById('output');
    outputElement.innerHTML += ansiToHtml(data) + '<br>';
    outputElement.scrollTop = outputElement.scrollHeight; // Auto-scroll to bottom
});

// Copy output to clipboard
function copyOutput() {
    const outputText = document.getElementById('output').textContent;
    navigator.clipboard.writeText(outputText).then(() => {
        alert('Output copied to clipboard!');
    }).catch((err) => {
        alert('Failed to copy output: ' + err);
    });
}

// Convert ANSI escape codes to HTML
function ansiToHtml(text) {
    return text
        .replace(/\x1b\[32m/g, '<span style="color: limegreen;">') // Green
        .replace(/\x1b\[31m/g, '<span style="color: red;">') // Red
        .replace(/\x1b\[33m/g, '<span style="color: yellow;">') // Yellow
        .replace(/\x1b\[0m/g, '</span>') // Reset
        .replace(/\n/g, '<br>'); // New lines
}