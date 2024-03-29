/**
 * Asynchronously creates an affiliate video by navigating a web page, interacting with specific elements, and submitting product details.
 * This function takes a screenshot of the full page initially, then performs a series of actions such as clicking a specific element, 
 * typing text into a textarea, and submitting the final story for the affiliate video. It handles waiting for elements to appear, typing 
 * with delays, and capturing screenshots at various stages of the process.
 * 
 * @param {object} page - The Puppeteer page object to interact with.
 * @param {object} productDetails - An object containing details about the product for which the affiliate video is being created.
 * 
 * @throws Will throw an error if the 'ShortGPT Stock Video Option' button is not found within the specified timeout or if the textarea
 * for inputting the video script is not found.
 * 
 * @example
 * // Assuming 'page' is a Puppeteer page instance and 'productDetails' is an object with product information
 * await createAffiliateVideo(page, { productName: "Example Product", price: "$19.99", discount: "10%" });
 */ 
 async function createAffiliateVideo(page, productDetails){
    await page.screenshot({ path: 'shortGPT/1_navigated.jpg', fullPage: true });

    // Click the element by XPath
    const clickXPath = '//*[@id="component-7"]/div[2]/label[2]/input';

    try {
        await page.waitForXPath(clickXPath, { timeout: 10000 });
    } catch (error) {
        await page.screenshot({ path: 'shortGPT/2_clicked.jpg', fullPage: true });
        throw new Error('\u001b[0;31mShortGPT Stock Video Option not found');
    }

    const clickElements = await page.$x(clickXPath);
    if (clickElements.length > 0) {
        await clickElements[0].click();
    }


    // Wait for and interact with the textarea
    const textAreaXPath = '//*[@id="component-11"]/label/textarea';
    await page.waitForXPath(textAreaXPath);
    const textArea = await page.$x(textAreaXPath);


    if (textArea.length > 0) {
        // Typing "vertical"
        console.log("1..... selecting alignment --> vertical")

        await textArea[0].type("vertical", { delay: 100 });
        await textArea[0].type(String.fromCharCode(13)); // Enter key
        await page.waitForTimeout(5000); // Wait for 5 seconds
        await page.screenshot({ path: 'shortGPT/.jpg', fullPage: true });
        console.log("2..... Selecting voice generation --> EdgeTTS")

        // Typing "EdgeTTS"
        await textArea[0].type("EdgeTTS", { delay: 100 });
        await textArea[0].type(String.fromCharCode(13)); // Enter key
        await page.waitForTimeout(5000); // Wait for 5 seconds
        await page.screenshot({ path: 'shortGPT/3_EdgeTTS.jpg', fullPage: true });

        // Typing "English"
        console.log("3..... selecting language --> English")

        await textArea[0].type("English", { delay: 100 });
        await textArea[0].type(String.fromCharCode(13)); // Enter key
        await page.waitForTimeout(5000); // Wait for 5 seconds
        await page.screenshot({ path: 'shortGPT/4_English.jpg', fullPage: true });

        const productDetailsString = JSON.stringify(productDetails);
        // Typing the story command
        console.log(`4..... generating story for  ${productDetailsString}: `)

        // TODO ADD DISCOUNT TO SCRIPT ( IF DISCOUNT IS GRANTED )
        const storyCommand = `Write a catchy script for a YouTube Short with the following: ${productDetailsString}`;
        console.log(storyCommand)
        await textArea[0].type(storyCommand);
        await page.screenshot({ path: 'shortGPT/5.1_story.jpg', fullPage: true });
        await textArea[0].type(String.fromCharCode(13)); // Enter key
        await page.screenshot({ path: 'shortGPT/5.2_story.jpg', fullPage: true });

        await page.waitForTimeout(5000); // Wait for 5 seconds
        await page.screenshot({ path: 'shortGPT/5.3_story.jpg', fullPage: true });
    } else {
        console.log("\u001b[0;31mError: text area not found in createAffiliateVideo function.")
        throw new Error('Textarea not found');
    }

    console.log("5..... submitting story")
    // Größerer WAIT NOTWENDING, da GPT hier noch ein script erzeugt.
    await page.waitForTimeout(15000);
    await page.keyboard.type("YES");
    await textArea[0].type(String.fromCharCode(13)); // Enter key
    await page.screenshot({ path: 'shortGPT/6_final_yes.jpg', fullPage: true });

    await page.waitForTimeout(5000);

    await page.screenshot({
        path: "shortGPT/7_final_screenshot.jpg",
        fullPage: true,
    });
}


module.exports = { createAffiliateVideo };