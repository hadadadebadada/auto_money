/**
 * Waits for a download button to become ready on a web page, taking periodic screenshots while waiting.
 * This function is designed to monitor the availability of a specified download button and capture screenshots
 * at regular intervals during the wait time. If the download button becomes ready within the allotted time,
 * it captures a screenshot indicating readiness and updates the context object to reflect success.
 *
 * @async
 * @param {object} page - The Puppeteer page object representing the web page to interact with.
 * @param {string} downloadButtonSelector - The CSS selector for the download button to wait for.
 * @param {object} context - An object to store the state of the download process, updated with the success status.
 * @throws Will throw an error if the download button does not appear within the specified maximum wait time.
 * @returns {Promise<void>} A promise that resolves when the function completes, either when the download button is found
 *                          or the maximum wait time is exceeded.
 */
async function waitForDownloadButton(page, downloadButtonSelector, context) {
    const maxWaitTime = 2400000; // 40 minutes
    const screenshotInterval = 300000; // 5 minutes
    const startTime = Date.now();

    try {
        console.log("6..... Waiting for the download button to be ready...");

        // Take an initial screenshot while waiting
        await page.screenshot({ path: 'shortGPT/download_waiting.jpg', fullPage: true });

        while (Date.now() - startTime < maxWaitTime) {
            if (await page.$(downloadButtonSelector)) {
                // Download button is ready, take a screenshot
                console.log("Download button is ready.");
                await page.screenshot({ path: 'shortGPT/download_ready.jpg', fullPage: true });
                context.downloadSuccess = true;
                break; // Exit the loop once the button is ready
            }

            // Wait for a specified interval before checking again
            await page.waitForTimeout(screenshotInterval);
        }

        // Additional logic to handle the download can go here

    } catch (error) {
        await page.screenshot({ path: 'shortGPT/download_failed.jpg', fullPage: true });
        console.log("Download button did not appear within 40 minutes.");
    }
}

module.exports = { waitForDownloadButton };