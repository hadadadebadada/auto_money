const { spawn } = require('child_process');

 function runPythonScript(script, args) {
    // Path to the Python interpreter in the virtual environment
    const venvPythonPath = '/home/brate/Dev/Scrape-anything---Web-AI-agent/youtubeEnv/bin/python';

    console.log(`Running Python script with virtual environment: ${script}`);
    console.log("Arguments:", args);

    const pythonProcess = spawn(venvPythonPath, [script, ...args]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

module.exports = { runPythonScript };