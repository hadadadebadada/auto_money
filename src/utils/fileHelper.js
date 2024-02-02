const path = require('path');
const fs = require('fs');

/**
 * Ensures that the directory for a given file path exists. If the directory does not exist, it is created
 * with all necessary parent directories.
 *
 * @param {string} filePath - The path of the file for which to ensure directory existence. The function extracts
 *                            the directory part of this path and checks if it exists.
 */
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}
/**
 * Converts an image file to a base64-encoded data URI asynchronously.
 * This function reads the provided image file, encodes its binary data as base64, and constructs
 * a data URI string that represents the image in the JPEG format.
 *
 * @async
 * @param {string} image_file - The path to the image file to be converted to base64.
 * @returns {Promise<string>} A promise that resolves with the base64-encoded data URI of the image.
 *                            The promise rejects if there is an error reading the file.
 */
async function image_to_base64(image_file) {
    return await new Promise((resolve, reject) => {
        fs.readFile(image_file, (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                reject();
                return;
            }

            const base64Data = data.toString('base64');
            const dataURI = `data:image/jpeg;base64,${base64Data}`;
            resolve(dataURI);
        });
    });
}

module.exports = { ensureDirectoryExistence, image_to_base64 };
