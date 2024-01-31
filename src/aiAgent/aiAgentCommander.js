const {highlight_links} = require('./linkHighlighter.js');
const {sleep, waitForEvent} = require('../utils/waiter.js'); 
const {image_to_base64} = require('../utils/fileHelper.js');
const timeout = 5000;
const OpenAI = require('openai');
const openai = new OpenAI();


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

module.exports = { useAiAgent };


// async function performAmazonSearch(searchTag, page) {
//     await page.waitForSelector('#twotabsearchtextbox');
//     await page.focus('#twotabsearchtextbox');
//     await page.keyboard.type(searchTag);
//     await page.keyboard.press('Enter');
//     console.log("Searching on Amazon for: " + searchTag);
// }