require('dotenv/config');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');


puppeteer.use(StealthPlugin());

const { createAffiliateVideo } = require('./src/shortGptVideoCreator/affiliateVideoCreator.js');
const { fetchChatCompletions } = require('./src/openAiApiRunner/videoContentGenerator.js');
const { generateProductSuggestions } = require('./src/serpApiRunner/serpProductSuggestionGenerator.js');
const { loginToAmazon } = require('./src/amazonAgent/amazonAgentCommander.js');
const { downloadAffiliateVideo } = require('./src/shortGptVideoCreator/affiliateVideoDownloader.js');

/**
 * This script automates the process of creating and uploading affiliate videos to YouTube using Puppeteer, OpenAI's GPT, and other utilities. It performs tasks such as logging into Amazon, extracting product details, generating video content, and managing video downloads. The script aims to automate the entire workflow for affiliate marketing through YouTube videos.
 * 
 * The process includes:
 * 1. Initializing Puppeteer with Stealth Plugin to avoid detection.
 * 2. Logging into Amazon to fetch product details including affiliate links.
 * 3. Using GPT-powered services to generate content for YouTube videos.
 * 4. Downloading the affiliate videos.
 * 5. Uploading the videos to YouTube.
 * 
 * The script is designed to handle multiple products, fetched based on a niche name provided as a command-line argument. It processes each product by generating suggestions, creating videos, and attempting uploads to YouTube. After a predefined number of successful uploads, the script pauses for a specified duration to avoid spamming or rate limits, then resumes to process additional products.
 * 
 * Usage:
 * To run the script, provide a niche name as a command-line argument. The script will then automatically process products related to the niche, handling various steps from content generation to video upload.
 * 
 * Example:
 * `node web_agent_5products.js "nicheName"`
 * 
 * Note: Modify the `successfulRuns === 1` check to change the number of videos processed before pausing, and adjust the sleep timeout as needed to fit the desired pause duration.
 */

async function processProduct(product, context) {
    //####################################################### PREPARE PUPPETEER ############################################################################
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
    //######################################## Login in to Amazon and get the affiliate link ###########################################################
    const { sanitizedProductName, productDetails } = await loginToAmazon(page, product);
    //############################################################### SHORT GPT CONTROLLER ###############################################################
    console.log("##########################  Starting ShortGPT ############################")
    console.log("Look for out in the folder 'shortGPT' for screenshots of the process")
    await page.goto('http://localhost:31415/');
    await createAffiliateVideo(page, productDetails);
    const downloadPath = await downloadAffiliateVideo(page, sanitizedProductName);
    //#########PREPARE YOUTUBE SCRIPT (Title, Content, Tags) WITH OPENAI AND UPLOAD IT TO YOUTUBE ############################################################################
    await fetchChatCompletions(productDetails, downloadPath)
        .then(() => context.downloadSuccess = true) // Set to true only if fetchChatCompletions succeeds
        .catch(console.error);
}





// ####################################################### MAIN SCRIPT ############################################################################
/// this script should upload 5 affiliate videos to youtube and then pause for 24 hours and 5 minuztes 
(async () => {


    console.log("\u001b[0;34m###########################################");
    console.log("# WEB AI AGENT RPA by \u001b[0;31mHadadadebadada\u001b[0m #");
    console.log("\u001b[0;34m###########################################");
    
    // Example usage in a terminal-like environment (not directly applicable in web console)
    console.log("\u001b[0;34mIf you're reading this, you've been in a coma for almost 20 years now. We're trying a new technique. We don't know where this message will end up in your dream, but we hope it works. Please wake up, we miss you.\u001b[0m");


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

                if (successfulRuns === 5) { // 1 for test purposes, 5 for real
                    console.log("Pausing script after 2 successful runs");
                    // Wait for 24 hours and 5 minutes (86,700,000 milliseconds)
                    //                   await new Promise(resolve => setTimeout(resolve, 86700000));
                    await new Promise(resolve => setTimeout(resolve, 86700000));
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








