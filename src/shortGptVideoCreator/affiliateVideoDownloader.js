const fs = require('fs');
const path = require('path');  
const http = require('http');
const {waitForDownloadButton} = require('./downloadButtonWaiter');

 /**
 * Asynchronously downloads an affiliate marketing video for a product with a sanitized product name.
 * This function waits for a download button to appear on the page, finds the video download link, and downloads
 * the video to a specified directory, naming it based on the sanitized product name.
 * 
 * @async
 * @function downloadAffiliateVideo
 * @param {object} page - The Puppeteer Page object representing a single page in the browser to interact with.
 * @param {string} sanitizedProductName - A sanitized string representing the product name, used in naming the download file path.
 * @returns {Promise<string>} The path where the video is downloaded. Returns a string indicating the path, or 'noneDownloadPath' if the download did not occur.
 * 
 * @example
 *  Assume page is a Puppeteer Page object and sanitizedProductName is "myProduct_2023".
 * downloadAffiliateVideo(page, "myProduct_2023").then(downloadPath => {
 *   console.log(downloadPath); // Logs the path where the video is saved.
 * });
 */
async function downloadAffiliateVideo(page, sanitizedProductName){



        let downloadPath = "noneDownloadPath"; // This will be modified within your function
        //####################################################### DOWNLOAD THE VIDEO ############################################################################
        const downloadButtonSelector = "#component-16 > div > a > button";
        await waitForDownloadButton(page, downloadButtonSelector);
        console.log("7..... Downloading the video");
        const linkXPath = "//a[contains(@href, 'file=videos/')]";
        const links = await page.$x(linkXPath);
    
    
    
        if (links.length > 0) {
            // Extract the video source URL
            const videoSrc = await page.evaluate(el => el.getAttribute('href'), links[0]);
    
            if (videoSrc) {
                // Define download path
                const fileName = videoSrc.split('/').pop();
                downloadPath = path.resolve(__dirname, '../../productInformation', `${sanitizedProductName}/${fileName}`);
    
                console.log("newly created downloadPath: ", downloadPath)
                // Ensure download directory exists
                if (!fs.existsSync(path.dirname(downloadPath))) {
                    fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
                }
    
                // Download the video file
                const file = fs.createWriteStream(downloadPath);
    
                http.get(videoSrc, function (response) {
                    response.pipe(file);
                    file.on('finish', function () {
                        file.close();
                        console.log(`File downloaded and saved to ${downloadPath}`);
                    });
                }).on('error', function (err) {
                    fs.unlink(downloadPath); // Delete the file on error
                    console.log('\u001b[0;31mError during download:', err.message);
                });
            } else {
                console.log('Video source not found');
            }
        } else {
            console.log("Download link not found");
        }
    
        return downloadPath;
}

module.exports = { downloadAffiliateVideo };