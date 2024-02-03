 



const { useAiAgent} = require('../aiAgent/aiAgentCommander.js');
const {ensureDirectoryExistence} = require('../utils/fileHelper.js');
const fs = require('fs');

// should me moven to waiter file
const randomWait = async () => {
    const waitTime = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000; // Random wait between 1 and 5 seconds
    await page.waitForTimeout(waitTime);
};


/**
 * Logs in to Amazon, navigates to a specified product, extracts its details, takes screenshots, and retrieves the product's affiliate link.
 * This function automates the process of logging into Amazon, searching for a product by name, selecting the first product from the search results,
 * extracting its details (title, feature bullets, price, optional discount, old price, and affiliate link), taking screenshots of the product page and
 * the product's main image, and saving these details into a JSON file. It also ensures the necessary directories exist for storing the screenshots and JSON file.
 *
 * @async
 * @param {object} page - The Puppeteer page object to interact with the web page.
 * @param {string} product - The name of the product to search for on Amazon.
 * @returns {Promise<{sanitizedProductName: string, productDetails: object}>} A promise that resolves with an object containing the sanitized product name
 *          (used in file paths) and a productDetails object with extracted product information.
 */
async function loginToAmazon(page, product) {


    let sanitizedProductName = "emtpySanitizedProductName"; 
    let productDetails = {}; //


    await page.goto('https://amazon.de');
    await page.setDefaultNavigationTimeout(60000); // 0 for no timeout
    const signInButton = await page.$('#nav-signin-tooltip > a');

    if (signInButton) {
        await randomWait();
        await page.click('#nav-signin-tooltip > a');
        await randomWait();
        await page.waitForSelector('#ap_email');
        await page.type('#ap_email', process.env.AMNZ_EMAIL);
        await page.click('#continue');
        await randomWait();
        await page.waitForSelector('#ap_password');
        await page.type('#ap_password', process.env.AMNZ_PW);
        await page.waitForSelector('#signInSubmit');
        await page.click('#signInSubmit');
        await randomWait();
    }



    //######################################## SIMPLIFIED WORKFLOW TO EXTRACT DATA AND GET THE AFFILIATE LINK ###########################################################



    //-------------------------------------------SELECTING THE PRODUCT---------------------------------------------------------------
    await page.waitForSelector('#twotabsearchtextbox');
    await page.focus('#twotabsearchtextbox');
    await page.keyboard.type(product);
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0' }),
        page.keyboard.press('Enter')
    ]);

    //-------------------------------------------TAKE INFORMATION OF THE PRODUCT---------------------------------------------------------------




    await useAiAgent("Click the first product on the page to get the detail information. But never click on 'Learn about these products' or 'Add to basket'", page); //you can click the image of the first product
   
    await page.waitForTimeout(randomWait);
    await page.waitForSelector('#imgTagWrapperId')

    sanitizedProductName = product.replace(/[^a-z0-9]/gi, '_');
    let firstListPath = `productInformation/${sanitizedProductName}/detailPage.jpg`;

    
    ensureDirectoryExistence(firstListPath);
    await page.screenshot({
        path: firstListPath,
        fullPage: true,
    });


    const element = await page.$('#landingImage'); // Select the #landingImage element
    if (element) {
        await element.screenshot({ path: `productInformation/${sanitizedProductName}/landingImage.png` }); // Take a screenshot of the element
    } else {
        console.log("Element #landingImage not found");
    }


    const titleSelector = '#title';
    const bulletsSelector = '#feature-bullets';
    const priceSelector = '#corePrice_feature_div > div > div > span.a-price.aok-align-center > span.a-offscreen'; //right side


    // Optional Discount
    const discountSelector = "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center > span.a-size-large.a-color-price.savingPriceOverride.aok-align-center.reinventPriceSavingsPercentageMargin.savingsPercentage"
    const oldPriceSelector = "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-small.aok-align-center > span > span.aok-relative > span > span > span:nth-child(2)"


    // Main Discription
    // TODO cet product details with aiAgent if not normal 
    const title = await page.$(titleSelector) ? await page.$eval(titleSelector, el => el.innerText.trim()) : 'Not Found';
    const bullets = await page.$(bulletsSelector) ? await page.$eval(bulletsSelector, el => el.innerText.trim()) : 'Not Found';
    const price = await page.$(priceSelector) ? await page.$eval(priceSelector, el => el.innerText.trim()) : 'Not Found';


    const discount = await page.$(discountSelector) ? await page.$eval(discountSelector, el => el.innerText.trim()) : null;
    const oldPrice = await page.$(oldPriceSelector) ? await page.$eval(oldPriceSelector, el => el.innerText.trim()) : null;



    //-------------------------------------------TAKE AFFILIATE LINK OF THE PRODUCT---------------------------------------------------------------



    //------------------------------------------------- Click1 by selector -----------------------------------------------------------------------
    await page.evaluate(() => {
        const listItem = document.getElementById('amzn-ss-text-link');
        if (listItem) {
            listItem.classList.add('active');
        }
    });
    await page.waitForTimeout(randomWait);

    await page.waitForTimeout(randomWait);
    //await page.screenshot({ path: `productInformation/${sanitizedProductName}/affiliate04.png` });

    //------------------------------------------------- Click3 by JS selector -----------------------------------------------------------------------
    try {
        await page.waitForFunction(() => {
            const link = document.querySelector("#amzn-ss-text-link > span > strong > a");
            return link !== null;
        });
        await page.evaluate(() => {
            document.querySelector("#amzn-ss-text-link > span > strong > a").click();
        });
    } catch (error) {
        console.error('\u001b[0;31mError while clicking element3:', error.message);
    }
    await page.waitForTimeout(5000);
    // await page.screenshot({ path: `productInformation/${sanitizedProductName}/affiliate05.png` });


    //------------------------------------------------- verify the popover is active -----------------------------------------------------------------------

    try {
        // console.log("verify affiliate popover is active...")
        const popoverSelector = 'div.a-popover.a-popover-has-header.a-declarative.a-arrow-bottom';
        await page.waitForSelector(popoverSelector);
    } catch (error) {
        console.log("\u001b[0;31mAffiliate Popover not found: " + error)
    }

    //------------------------------------------------- get the link -----------------------------------------------------------------------

    const affiliateLinkTextBoxSelector = "#amzn-ss-text-shortlink-textarea";

    // Extract the text
    const affiliateLink = await page.$eval(affiliateLinkTextBoxSelector, el => el.value || el.textContent);


    //------------------------------------------------- write the link to json object -----------------------------------------------------------------------
    // Organize content into a JSON structure
     productDetails = {
        title,
        bullets,
        price,
        discount,
        oldPrice,
        affiliateLink
    };


    // Define directory and file path for JSON
    let jsonFilePath = `productInformation/${sanitizedProductName}/productDetails.json`;
    ensureDirectoryExistence(jsonFilePath);

    // Write JSON to file
    fs.writeFileSync(jsonFilePath, JSON.stringify(productDetails, null, 2));

    return { sanitizedProductName, productDetails };
}



module.exports = { loginToAmazon };