/**
 * Pauses the execution for a specified number of milliseconds.
 * This function creates a promise that resolves after a given time delay, effectively pausing the execution
 * of an async function for the specified period.
 *
 * @async
 * @param {number} milliseconds - The number of milliseconds to pause execution.
 * @returns {Promise<void>} A promise that resolves after the specified delay, allowing for a sleep effect
 *                          in asynchronous functions.
 */
async function sleep(milliseconds) {
    return await new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, milliseconds);
    });
}

/**
 * Waits for a specific event to be fired on the page.
 * This function injects a script into the page that listens for a specified event. Once the event occurs,
 * the promise resolves. It's useful for synchronizing operations with actions or animations on the page.
 *
 * @async
 * @param {object} page - The Puppeteer page object representing the web page to interact with.
 * @param {string} event - The name of the event to wait for.
 * @returns {Promise<void>} A promise that resolves once the specified event has been fired on the page.
 */
async function waitForEvent(page, event) {
    return page.evaluate((event) => {
        return new Promise((resolve) => {
            document.addEventListener(event, function () {
                resolve();
            });
        });
    }, event);
}

module.exports = { sleep, waitForEvent };
