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