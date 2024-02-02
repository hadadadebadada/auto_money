const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Trims a given title to a specified maximum length without cutting off the last word.
 * @param {string} title - The title to be trimmed.
 * @param {number} maxLength - The maximum length the title can be.
 * @returns {string} - The trimmed title, ensuring it ends with a full word and does not exceed the maxLength.
 */
function trimTitleToMaxLength(title, maxLength) {
    if (title.length <= maxLength) return title;
    return title.substring(0, title.lastIndexOf(' ', maxLength));
}

/**
 * Executes a Python script intended for video processing, using data from a specified folder.
 * This function reads a JSON file containing product details, finds a video file in the same folder,
 * and runs a Python script with these details as arguments. It's designed to support video upload workflows,
 * such as preparing videos for YouTube by setting titles, descriptions, and other metadata.
 * 
 * @param {string} script - The path to the Python script to be executed.
 * @param {string} folderPath - The path to the folder containing the video and product details JSON file.
 */
function runPythonScript(script, folderPath) {

    console.log("\u001b[0;34m###########################################");
    console.log("# WEB AI AGENT RPA by \u001b[0;31mHadadadebadada\u001b[0m #");
    console.log("\u001b[0;34m###########################################");
    
    // Example usage in a terminal-like environment (not directly applicable in web console)
    console.log("\u001b[0;34mIf you're reading this, you've been in a coma for almost 20 years now. We're trying a new technique. We don't know where this message will end up in your dream, but we hope it works. Please wake up, we miss you.\u001b[0m");





    // Read the JSON file
    const jsonFilePath = path.join(folderPath, 'productDetails.json');
    const productDetails = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

    // Find the .mp4 file
    const files = fs.readdirSync(folderPath);
    const videoFile = files.find(file => file.endsWith('.mp4'));

    if (!videoFile) {
        console.error('No .mp4 file found in the folder');
        return;
    }

    // Trim the title to a maximum of 76 characters ending with a full word
    const trimmedTitle = trimTitleToMaxLength(productDetails.title, 76);

    // Construct args array
    let args = [
        `--file=${path.join(folderPath, videoFile)}`,
        `--title=${trimmedTitle}`,
        `--description=${productDetails.bullets.replace(/\n/g, ' ')}` +
        ` Get it here: ${productDetails.affiliateLink}`,
        '--keywords=Your, Keywords, Here', // Modify this line as needed
        '--privacyStatus=public'
    ];

    // Ensure each argument is a single string
    args = args.map(arg => arg.replace(/\s+/g, ' '));

    console.log(`Running Python script with virtual environment: ${script}`);
    console.log("Arguments:", args);

    const venvPythonPath = path.resolve(__dirname, '../../', 'youtubeEnv', 'bin', 'python');
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
  const scriptPath = path.resolve(__dirname, '../../', 'upload_video.py');

const folderPath = '/home/brate/Dev/clean_youtube_uploader (copy)/productInformation/ASUS_Zenbook_Laptops___All_Models';
runPythonScript(scriptPath, folderPath);
