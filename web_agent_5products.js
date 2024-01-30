const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const OpenAI = require('openai');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { stringify } = require('querystring');
const http = require('http'); // 
const { spawn } = require('child_process');
const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);


// Function to ensure directory exists
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

require('dotenv/config');

puppeteer.use(StealthPlugin());

const openai = new OpenAI();
const timeout = 5000;

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



// async function performAmazonSearch(searchTag, page) {
//     await page.waitForSelector('#twotabsearchtextbox');
//     await page.focus('#twotabsearchtextbox');
//     await page.keyboard.type(searchTag);
//     await page.keyboard.press('Enter');
//     console.log("Searching on Amazon for: " + searchTag);
// }

async function sleep(milliseconds) {
    return await new Promise((r, _) => {
        setTimeout(() => {
            r();
        }, milliseconds);
    });
}

async function highlight_links(page) {
    await page.evaluate(() => {
        document.querySelectorAll('[gpt-link-text]').forEach(e => {
            e.removeAttribute("gpt-link-text");
        });
    });

    const elements = await page.$$(
        "a, button, input, textarea, [role=button], [role=treeitem]"
    );

    elements.forEach(async e => {
        await page.evaluate(e => {
            function isElementVisible(el) {
                if (!el) return false; // Element does not exist

                function isStyleVisible(el) {
                    const style = window.getComputedStyle(el);
                    return style.width !== '0' &&
                        style.height !== '0' &&
                        style.opacity !== '0' &&
                        style.display !== 'none' &&
                        style.visibility !== 'hidden';
                }

                function isElementInViewport(el) {
                    const rect = el.getBoundingClientRect();
                    return (
                        rect.top >= 0 &&
                        rect.left >= 0 &&
                        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                    );
                }

                // Check if the element is visible style-wise
                if (!isStyleVisible(el)) {
                    return false;
                }

                // Traverse up the DOM and check if any ancestor element is hidden
                let parent = el;
                while (parent) {
                    if (!isStyleVisible(parent)) {
                        return false;
                    }
                    parent = parent.parentElement;
                }

                // Finally, check if the element is within the viewport
                return isElementInViewport(el);
            }

            e.style.border = "1px solid red";

            const position = e.getBoundingClientRect();

            if (position.width > 5 && position.height > 5 && isElementVisible(e)) {
                const link_text = e.textContent.replace(/[^a-zA-Z0-9 ]/g, '');
                e.setAttribute("gpt-link-text", link_text);
            }
        }, e);
    });
}

async function waitForEvent(page, event) {
    return page.evaluate(event => {
        return new Promise((r, _) => {
            document.addEventListener(event, function (e) {
                r();
            });
        });
    }, event)
}

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



    //######################################## SIMPLIFIED WORKFLOW ###########################################################



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

    //------------------------------------------------- Click the first element in the search list view by fullXpath -----------------------------------------------------------------------

    // const fullXpath = '/html/body/div[1]/div[1]/div[1]/div/div[2]/ul/li/span/strong/a';
    // try {
    //     await page.waitForXPath(fullXpath);
    //     const elements2 = await page.$x(fullXpath);
    //     if (elements2.length > 0) {
    //         await elements2[0].click();
    //     } else {
    //         console.error('Element not found1');
    //     }
    // } catch (error) {
    //     console.error('Error while clicking element2:', error.message);
    // }
    await page.waitForTimeout(randomWait);
    await page.screenshot({ path: `productInformation/${sanitizedProductName}/affiliate04.png` });

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
    await page.screenshot({ path: `productInformation/${sanitizedProductName}/affiliate05.png` });


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



    //############################################################### SHORT GPT CONTROLLER ###############################################################



    //############################### WITH SCREENSHOTS ##############################################################
    console.log("##########################  Starting ShortGPT ############################")
    console.log("Look for out in the folder 'shortGPT' for screenshots of the process")
    await page.goto('http://localhost:31415/');

    ensureDirectoryExistence("shortGPT/1_navigated.jpg");

    await page.screenshot({ path: 'shortGPT/1_navigated.jpg', fullPage: true });

    // Click the element by XPath
    const clickXPath = '//*[@id="component-7"]/div[2]/label[2]/input';

    try {
        await page.waitForXPath(clickXPath, { timeout: 10000 });
    } catch (error) {
        await page.screenshot({ path: 'shortGPT/2_clicked.jpg', fullPage: true });
        throw new Error('ShortGPT Stock Video Option not found');
    }

    const clickElements = await page.$x(clickXPath);
    if (clickElements.length > 0) {
        await clickElements[0].click();
    }


    // if (clickElement.length > 0) {
    //     await clickElement[0].click();
    // } else {
    //     await page.screenshot({ path: 'shortGPT/2_clicked.jpg', fullPage: true });
    //     throw new Error('ShortGPT Stock Video Option not found');
    // }

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
        console.log("Error")
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



    const downloadButtonSelector = "#component-16 > div > a > button";

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


    // tryed to encapsulate the download function, but it didnt work


    // async function downloadVideo(page, linkXPath, sanitizedProductName) {
    //     try {
    //         const links = await page.$x(linkXPath);
    //         let downloadPath = "";

    //         if (links.length > 0) {
    //             // Extract the video source URL
    //             const videoSrc = await page.evaluate(el => el.getAttribute('href'), links[0]);

    //             if (videoSrc) {
    //                 // Define download path
    //                 const fileName = videoSrc.split('/').pop();
    //                 downloadPath = path.resolve(__dirname, `productInformation/${sanitizedProductName}/${fileName}`);

    //                 // Ensure download directory exists
    //                 if (!fs.existsSync(path.dirname(downloadPath))) {
    //                     fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
    //                 }

    //                 // Download the video file
    //                 return new Promise((resolve, reject) => {
    //                     const file = fs.createWriteStream(downloadPath);
    //                     http.get(videoSrc, function (response) {
    //                         response.pipe(file);
    //                         file.on('finish', function () {
    //                             file.close();
    //                             console.log(`File downloaded and saved to ${downloadPath}`);
    //                             resolve(downloadPath);
    //                         });
    //                     }).on('error', function (err) {
    //                         fs.unlink(downloadPath); // Delete the file on error
    //                         console.error('Error during download:', err.message);
    //                         reject(err);
    //                     });
    //                 });
    //             } else {
    //                 console.log('Video source not found');
    //                 return null;
    //             }
    //         } else {
    //             console.log("Download link not found");
    //             return null;
    //         }
    //     } catch (error) {
    //         console.error("Error in downloadVideo function:", error);
    //         return null;
    //     }
    // }

    // await downloadVideo(page, linkXPath, sanitizedProductName);

    //####################################################### PREPARE YOUTUBE SCRIPT ############################################################################





    function trimTitle(jsonObj) {
        // Extracting the title
        let title = jsonObj.title;

        // Check if the title is longer than 76 characters
        if (title.length > 76) {
            // Truncate the string to 76 characters
            title = title.substring(0, 76);

            // Find the last space to avoid cutting in the middle of a word
            let lastSpace = title.lastIndexOf(' ');

            // If there's no space, keep the truncated title as is
            // If there is, trim up to the last space
            if (lastSpace > 0) {
                title = title.substring(0, lastSpace);
            }
        }

        // Update the title in the JSON object
        jsonObj.title = title;

        return title;
    }

    function runPythonScript(script, args) {
        // Path to the Python interpreter in the virtual environment
        const venvPythonPath = '/home/brate/Dev/Scrape-anything---Web-AI-agent/youtubeEnv/bin/python';

        console.log(`Running Python script with virtual environment: ${script}`);
        console.log("Arguments:", args);

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


    //################################################################ CALL GPT FOR VIDEO DETAILS ##############################################################

    //hier wird das python script aufgerufen, welches die videos uploadet
    async function fetchChatCompletions(productDetails, downloadPath) {



        let promptTemplate = "Assume you are a marketing expert specializing in YouTube short videos. Your role involves understanding and leveraging psychological principles to enhance viewer engagement and retention. Discuss strategies for creating captivating YouTube shorts, focusing on psychological aspects such as the attention span of viewers, the role of emotions in content engagement, and the use of storytelling to make content more relatable and memorable. Provide insights on how these psychological elements can be applied to different genres of content, like educational, entertainment, and lifestyle. Also, include tips on optimizing video titles and descriptions for maximum impact and viewer curiosity. Finally, address the importance of understanding audience demographics and preferences to tailor content effectively."


        // const openai = new OpenAI();

        // const titleResponse = await openai.chat.completions.create({
        //     messages: [
        //         { "role": "system", "content": "You are a helpful assistant." },
        //         { "role": "user", "content": `Create an engaging and informative title for a YouTube video showcasing "${productDetails.title}". The title should highlight key features and appeal to the target audience.` }
        //     ],
        //     model: "gpt-3.5-turbo",
        // });

        // Fetch description
        const descriptionResponse = await openai.chat.completions.create({
            messages: [
                { "role": "system", "content": promptTemplate },
                { "role": "user", "content": `Given this product information: ${JSON.stringify(productDetails, null, 2)}.\n\nCreate a succinct and engaging description for a YouTube video showcasing the product. The description should captivate the target audience, highlighting the product's key features and benefits as detailed in the product information. Conclude the description explicitly with 'Get it now' or 'Get it here:', ensuring no placeholders for links (like '[Affiliate Link]') are included. The final phrase should directly lead into this ending, without additional text or symbols. Limit the description to a maximum of 100 words.` }
            ],
            model: "gpt-3.5-turbo",
        });


        // Fetch tags
        const tagsResponse = await openai.chat.completions.create({
            messages: [
                { "role": "system", "content": promptTemplate },
                {
                    "role": "user", "content": `Generate a list of effective keywords for a YouTube video about "${productDetails.title}". Consider terms that resonate with potential customers interested in features like those mentioned in the product's description. Just write 10 Tags, Only the Tags, nothing more also never add any kind of aditional information or prefixes to the Tags, I want just 10 raw Tags!`
                }
            ],
            model: "gpt-3.5-turbo",
        });


        // const tagsResponse = await openai.chat.completions.create({
        //     messages: [
        //         { "role": "system", "content": promptTemplate },
        //         {
        //             "content": `Given this product information: ${JSON.stringify(productDetails, null, 2)}.\n\nCraft a concise and engaging description for a YouTube video featuring the product. The description should resonate with the target audience, emphasizing the main features and benefits from the product details. Keep the language straightforward and the description under 100 words. Conclude with 'Get it here:', smoothly transitioning into this phrase without any placeholders for links. This ending should be the last part of the response with no additional text or symbols following it.`
        //         }
        //     ],
        //     model: "gpt-3.5-turbo",
        // });
        // // prompts should create title, description, tags to start  the python_upload.py script
        // // description end EVERYTIME with "Get it now here: ", if there is a discount on the product "Get it exclusively with discount here: "



        // //####################################################### START YOUTUBE SCRIPT ############################################################################



        console.log("trimmed title =", trimTitle(productDetails));

        const args = [
            `--file=${downloadPath}`,
            `--title=${trimTitle(productDetails)} ${affiliateLink}`, // TODO: ADD A MAX LENGHT!!
            `--description=${descriptionResponse.choices[0].message.content.replace(/"/g, '')} ${affiliateLink}`,
            `--keywords=${tagsResponse.choices[0].message.content.replace(/"/g, '')}`,
            '--privacyStatus=public'
        ];



        const script = "upload_video.py";
        runPythonScript(script, args);


    }

    fetchChatCompletions(productDetails, downloadPath).catch(console.error);




    //############################################################### AI FUNCTIONALITY ###############################################################



    async function useAiAgent(command, page) {
        const messages = [
            {
                "role": "system",
                "content": `You are a website crawler. You will be given instructions on what to do by browsing. You are connected to a web browser and you will be given the screenshot of the website you are on. The links on the website will be highlighted in red in the screenshot. Always read what is in the screenshot. Don't guess link names.
        
                    You can go to a specific URL by answering with the following JSON format:
                    {"url": "url goes here"}
        
                    You can click links on the website by referencing the text inside of the link/button, by answering in the following JSON format:
                    {"click": "Text in link"}
        
                    Once you are on a URL and you have found the answer to the user's question, you can answer with a regular message.
        
                    `,
            }
        ];
        console.log("Amazon Scraper: How can I assist you today?")

        messages.push({
            "role": "user",
            "content": command,
        });

        let url = await page.url(); // Set the URL to the current page

        let screenshot_taken = false;

        let promptRunner = true;

        while (promptRunner) { // Ensures the while loop doesn't lead to an infinite loop
            if (url) {
                console.log("Crawling " + url);
                await page.goto(url, {
                    waitUntil: "domcontentloaded",
                    timeout: timeout,
                });

                await Promise.race([
                    waitForEvent(page, 'load'),
                    sleep(timeout)
                ]);

                await highlight_links(page);

                await page.screenshot({
                    path: "screenshot.jpg",
                    // fullPage: true,
                });

                screenshot_taken = true;
                url = null;
            }

            if (screenshot_taken) {
                const base64_image = await image_to_base64("screenshot.jpg");

                messages.push({
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": base64_image,
                        },
                        {
                            "type": "text",
                            "text": "Here's the screenshot of the website you are on right now. You can click on links with {\"click\": \"Link text\"} or you can crawl to another URL if this one is incorrect. If you find the answer to the user's question, you can respond normally.",
                        }
                    ]
                });

                screenshot_taken = false;
            }

            const response = await openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                max_tokens: 1024,
                messages: messages,
            });

            const message = response.choices[0].message;
            const message_text = message.content;

            messages.push({
                "role": "assistant",
                "content": message_text,
            });

            console.log("GPT: " + message_text);

            //        Rest of your code...
            if (message_text.indexOf('{"click": "') !== -1) {
                let parts = message_text.split('{"click": "');
                parts = parts[1].split('"}');
                const link_text = parts[0].replace(/[^a-zA-Z0-9 ]/g, '');

                console.log("Clicking on " + link_text)

                try {
                    const elements = await page.$$('[gpt-link-text]');

                    let partial;
                    let exact;

                    for (const element of elements) {
                        const attributeValue = await element.evaluate(el => el.getAttribute('gpt-link-text'));

                        if (attributeValue.includes(link_text)) {
                            partial = element;
                        }

                        if (attributeValue === link_text) {
                            exact = element;
                        }
                    }

                    if (exact || partial) {
                        const [response] = await Promise.all([
                            page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(e => console.log("Navigation timeout/error:", e.message)),
                            (exact || partial).click()
                        ]);

                        // Additional checks can be done here, like validating the response or URL
                        await Promise.race([
                            waitForEvent(page, 'load'),
                            sleep(timeout)
                        ]);

                        await highlight_links(page);

                        await page.screenshot({
                            path: "screenshot.jpg",
                            quality: 100,
                            fullpage: true
                        });

                        screenshot_taken = true;
                    } else {
                        throw new Error("Can't find link");
                    }
                } catch (error) {
                    console.log("ERROR: Clicking failed", error);

                    messages.push({
                        "role": "user",
                        "content": "ERROR: I was unable to click that element",
                    });
                }

                continue;


            }


            if (message_text.indexOf('{"search": "') !== -1) {
                let parts = message_text.split('{"search": "');
                parts = parts[1].split('"}');
                const searchTag = parts[0];

                await page.waitForSelector('#twotabsearchtextbox');
                await page.focus('#twotabsearchtextbox');
                await page.keyboard.type(searchTag);

                // Trigger the search and wait for navigation to complete
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    page.keyboard.press('Enter')
                ]);

                console.log("Searching on Amazon for: " + searchTag);

                await Promise.race([
                    waitForEvent(page, 'load'),
                    sleep(timeout)
                ]);

                await highlight_links(page);




                await page.screenshot({
                    path: "searchResult.jpg",
                    fullPage: true,
                });

                screenshot_taken = true;
                continue;
            }


            else if (message_text.indexOf('{"url": "') !== -1) {
                let parts = message_text.split('{"url": "');
                parts = parts[1].split('"}');
                url = parts[0];

                continue;
            }

            promptRunner = false;


            console.log("ending ai agent....");


        }
    }









}


async function generateProductSuggestions(nicheName) {
    try {
        const params = {
            q: `${nicheName} products`,
            location: "United States",
            google_domain: "google.com",
            gl: "us",
            hl: "en"
        };

        const productsResponse = await new Promise((resolve, reject) => {
            search.json(params, (data) => {
                if (data) resolve(data);
                else reject("Failed to fetch data");
            });
        });

        console.log(productsResponse)

        if (!productsResponse || !productsResponse.organic_results) {
            console.error('Invalid response from API:', productsResponse);
            return [];
        }

        // Extract product names from the response
        const products = productsResponse.organic_results.map(result => result.title);

        console.log(products)

        return products.filter(product => product.trim() !== ''); // Filter out empty lines
    } catch (error) {
        console.error('Error calling SerpApi:', error);
        return [];
    }
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

                if (successfulRuns === 5) {
                    console.log("Pausing script after 5 successful runs");
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

