const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const os = require('os');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 600,
        icon: path.join(__dirname, 'icon', 'logo.icns'),  // Path to your .icns file
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Function to check if a tool is installed
function isToolInstalled(tool, callback) {
    exec(`command -v ${tool} || where ${tool}`, (error, stdout) => {
        callback(stdout.trim().length > 0);
    });
}

// Function to install the missing tool
function installTool(tool, event) {
    const platform = os.platform();
    let installCommand = '';

    switch (platform) {
        case 'linux':
            installCommand = getLinuxInstallCommand(tool);
            break;
        case 'darwin': // macOS
            installCommand = `brew install ${tool.toLowerCase()}`;
            break;
        case 'win32': // Windows
            installCommand = getWindowsInstallCommand(tool);
            break;
        default:
            event.reply('tool-output', `OS not supported for automated install.`);
            return;
    }

    if (installCommand) {
        exec(installCommand, (error, stdout, stderr) => {
            if (error) {
                event.reply('tool-output', `Error installing ${tool}: ${stderr}`);
            } else {
                event.reply('tool-output', `${tool} installed successfully!`);
            }
        });
    }
}

// Get correct install command for Linux
function getLinuxInstallCommand(tool) {
    const packageManagers = [
        `sudo apt install ${tool.toLowerCase()} -y`,     // Debian/Ubuntu
        `sudo pacman -S ${tool.toLowerCase()} --noconfirm`, // Arch Linux
        `sudo dnf install ${tool.toLowerCase()} -y`,    // Fedora
        `sudo zypper install ${tool.toLowerCase()}`,    // OpenSUSE
    ];
    return packageManagers.join(' || ');
}

// Get correct install command for Windows
function getWindowsInstallCommand(tool) {
    const chocolateyTools = {
        'nmap': 'choco install nmap -y',
        'masscan': 'choco install masscan -y',
        'sqlmap': 'pip install sqlmap',
        'nikto': 'choco install nikto -y',
        'metasploit': 'choco install metasploit -y',
        'wireshark': 'choco install wireshark -y',  // Ensure Wireshark is included
    };
    return chocolateyTools[tool.toLowerCase()] || '';
}

// Listen for test execution requests
ipcMain.on('run-test', (event, tool, target) => {
    isToolInstalled(tool, (installed) => {
        if (!installed) {
            dialog.showMessageBoxSync({
                type: 'warning',
                title: 'Tool Not Installed',
                message: `${tool} is not installed. Would you like to install it?`,
                buttons: ['Yes', 'No']
            }) === 0 ? installTool(tool, event) : event.reply('tool-output', `Please install ${tool} manually.`);
        } else {
            runSecurityTool(tool, target, event);
        }
    });
});

// Function to execute the security tool
function runSecurityTool(tool, target, event) {
    let command = '';

    switch (tool) {
        case 'Nmap': command = `nmap -sV ${target}`; break;
        case 'Masscan': command = `masscan ${target} -p1-65535 --rate=1000`; break;
        case 'SQLmap': command = `sqlmap -u ${target} --batch --dbs`; break;
        case 'Nikto': command = `nikto -h ${target}`; break;
        case 'Metasploit': command = `msfconsole -q -x "use auxiliary/scanner/portscan/tcp; set RHOSTS ${target}; run; exit"`; break;
        case 'Wireshark': command = `tshark -i eth0 -a duration:10`; break;
        default: event.reply('tool-output', 'Unknown tool selected.');
    }

    if (command) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                event.reply('tool-output', `Error running ${tool}: ${stderr}`);
            } else {
                event.reply('tool-output', stdout);
            }
        });
    }
}
