require('dotenv/config');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

const fs = require('fs');
const path = require('path');
const http = require('http'); // 

puppeteer.use(StealthPlugin());

const { ensureDirectoryExistence } = require('./src/utils/fileHelper.js'); 
const {createAffiliateVideo} = require('./src/shortGptVideoCreator/affiliateVideoCreator.js');
const {waitForDownloadButton} = require('./src/shortGptVideoCreator/downloadButtonWaiter.js'); // watch would be a better name
const {useAiAgent} = require('./src/aiAgent/aiAgentCommander.js');
const { fetchChatCompletions } = require('./src/openAiApiRunner/videoContentGenerator.js');
const {generateProductSuggestions} = require('./src/serpApiRunner/serpProductSuggestionGenerator.js');



async function processProduct(product, context) {

    console.log("###########################################");
    console.log("# GPT4V-Browsing by Unconventional Coding #");
    console.log("###########################################\n");

    context.downloadSuccess = false;

    const browser = await puppeteer.launch({
        headless: "false",
        executablePath: '/usr/bin/google-chrome',
        userDataDir: '/home/brate/.config/google-chrome/Default',
        args: ['--no-sandbox', '--disable-setuid-sandbox']


    });

    const page = await browser.newPage();


    await page.setViewport({
        width: 1200,
        height: 1200,
        deviceScaleFactor: 1,
    });

    const randomWait = async () => {
        const waitTime = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000; // Random wait between 1 and 5 seconds
        await page.waitForTimeout(waitTime);
    };



    //######################################## Login in to Amazon ###########################################################
    // TODO --> extract the amazon part into a function and call it here

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

    let sanitizedProductName = product.replace(/[^a-z0-9]/gi, '_');

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
        console.error('Error while clicking element3:', error.message);
    }
    await page.waitForTimeout(5000);
    // await page.screenshot({ path: `productInformation/${sanitizedProductName}/affiliate05.png` });


    //------------------------------------------------- verify the popover is active -----------------------------------------------------------------------

    try {
        // console.log("verify affiliate popover is active...")
        const popoverSelector = 'div.a-popover.a-popover-has-header.a-declarative.a-arrow-bottom';
        await page.waitForSelector(popoverSelector);
        console.log("Adding affiliate link to product details json...")
    } catch (error) {
        console.log(error)
    }




    //------------------------------------------------- get the link -----------------------------------------------------------------------

    const affiliateLinkTextBoxSelector = "#amzn-ss-text-shortlink-textarea";

    // Extract the text
    const affiliateLink = await page.$eval(affiliateLinkTextBoxSelector, el => el.value || el.textContent);




    //------------------------------------------------- write the link to json object -----------------------------------------------------------------------

    // Organize content into a JSON structure
    const productDetails = {
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






    // ######################################################### AMAZON ENDS HERE ######################################################################
    // TODO --> extract the amazon part into a function and call it here





    //############################################################### SHORT GPT CONTROLLER ###############################################################



    //############################### WITH SCREENSHOTS ##############################################################
    console.log("##########################  Starting ShortGPT ############################")
    console.log("Look for out in the folder 'shortGPT' for screenshots of the process")
    await page.goto('http://localhost:31415/');

    ensureDirectoryExistence("shortGPT/1_navigated.jpg");



    await createAffiliateVideo(page, productDetails);


    const downloadButtonSelector = "#component-16 > div > a > button";


    await waitForDownloadButton(page, downloadButtonSelector);


    console.log("7..... Downloading the video");


    const linkXPath = "//a[contains(@href, 'file=videos/')]";


    const links = await page.$x(linkXPath);

    let downloadPath = "";


    if (links.length > 0) {
        // Extract the video source URL
        const videoSrc = await page.evaluate(el => el.getAttribute('href'), links[0]);

        if (videoSrc) {
            // Define download path
            const fileName = videoSrc.split('/').pop();
            downloadPath = path.resolve(__dirname, `productInformation/${sanitizedProductName}/${fileName}`);

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
                console.log('Error during download:', err.message);
            });
        } else {
            console.log('Video source not found');
        }
    } else {
        console.log("Download link not found");
    }




    //####################################################### PREPARE YOUTUBE SCRIPT (Title, Content, Tags) AND UPLOAD IT ############################################################################

    fetchChatCompletions(productDetails, downloadPath).catch(console.error);





}

/// this script should upload 5 products to youtube and then pause for 24 hours and 5 minutes

(async () => {
    const nicheName = process.argv[2]; // Get the niche name from the command line
    const products = await generateProductSuggestions(nicheName); // Generate products
    const context = { downloadSuccess: false };
    let successfulRuns = 0; // Counter for successful runs


    for (const product of products) {
        try {
            console.log(`Processing: ${product}`);
            await processProduct(product, context);
            if (context.downloadSuccess) {
                console.log(`Download successful for ${product}`);
                successfulRuns++;

                if (successfulRuns === 1) { // 1 for test purposes, 5 for real
                    console.log("Pausing script after 1 successful runs");
                    // Wait for 24 hours and 5 minutes (86,700,000 milliseconds)
                    //                   await new Promise(resolve => setTimeout(resolve, 86700000));
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    console.log("Resuming script after 24 hours and 5 minutes");
                    successfulRuns = 0; // Reset successful runs counter if you want to pause again after next 5 runs
                }
            } else {
                console.log(`Download failed for ${product}`);
            }
        } catch (error) {
            console.error(`Error processing product ${product}:`, error);
            continue;
        }
    }
})();








