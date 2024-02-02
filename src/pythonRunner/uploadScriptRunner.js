const { spawn } = require('child_process');


/**
 * Executes a Python script using a specified virtual environment's Python interpreter.
 * This function spawns a child process to run the Python script with the provided arguments.
 * It logs the standard output and standard error streams to the console and reports the exit
 * code of the child process upon completion. This function is designed to integrate Python
 * scripts into a Node.js application, allowing for inter-language communication and script execution.
 *
 * @param {string} script - The path to the Python script to be executed.
 * @param {Array<string>} args - An array of arguments to be passed to the Python script.
 */

 function runPythonScript(script, args) {
    // Path to the Python interpreter in the virtual environment
    const venvPythonPath = "../../youtubeEnv/bin/python";

    console.log(`Running Python script with virtual environment: ${script}`);
    console.log("Arguments:", args);

    const pythonProcess = spawn(venvPythonPath, [script, ...args]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.log("whats up with this error")
        console.error(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

module.exports = { runPythonScript };