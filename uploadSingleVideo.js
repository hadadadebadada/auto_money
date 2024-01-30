const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function trimTitleToMaxLength(title, maxLength) {
    if (title.length <= maxLength) return title;
    return title.substring(0, title.lastIndexOf(' ', maxLength));
}

function runPythonScript(script, folderPath) {
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

    const venvPythonPath = '/home/brate/Dev/Scrape-anything---Web-AI-agent/youtubeEnv/bin/python';
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

// Example usage
const folderPath = '/home/brate/Dev/clean_youtube_uploader/productInformation/Hypervolt_Go_2';
runPythonScript("upload_video.py", folderPath);
