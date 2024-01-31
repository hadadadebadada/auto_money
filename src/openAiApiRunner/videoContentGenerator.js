const OpenAI = require('openai');
const openai = new OpenAI();
const { trimTitle } = require('../utils/trimTitle.js');

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


async function fetchChatCompletions(productDetails, downloadPath) {



    let promptTemplate = "Assume you are a marketing expert specializing in YouTube short videos. Your role involves understanding and leveraging psychological principles to enhance viewer engagement and retention. Discuss strategies for creating captivating YouTube shorts, focusing on psychological aspects such as the attention span of viewers, the role of emotions in content engagement, and the use of storytelling to make content more relatable and memorable. Provide insights on how these psychological elements can be applied to different genres of content, like educational, entertainment, and lifestyle. Also, include tips on optimizing video titles and descriptions for maximum impact and viewer curiosity. Finally, address the importance of understanding audience demographics and preferences to tailor content effectively."


    const descriptionResponse = await openai.chat.completions.create({
        messages: [
            { "role": "system", "content": promptTemplate },
            { "role": "user", "content": `Given this product information: ${JSON.stringify(productDetails, null, 2)}.\n\nCreate a succinct and engaging description for a YouTube video showcasing the product. The description should captivate the target audience, highlighting the product's key features and benefits as detailed in the product information. Conclude the description explicitly with 'Get it now' or 'Get it here:', ensuring no placeholders for links (like '[Affiliate Link]') are included. The final phrase should directly lead into this ending, without additional text or symbols. Limit the description to a maximum of 100 words.` }
        ],
        model: "gpt-3.5-turbo",
    });


    const tagsResponse = await openai.chat.completions.create({
        messages: [
            { "role": "system", "content": promptTemplate },
            {
                "role": "user", "content": `Generate a list of effective keywords for a YouTube video about "${productDetails.title}". Consider terms that resonate with potential customers interested in features like those mentioned in the product's description. Just write 10 Tags, Only the Tags, nothing more also never add any kind of aditional information or prefixes to the Tags, I want just 10 raw Tags!`
            }
        ],
        model: "gpt-3.5-turbo",
    });


    // //####################################################### START YOUTUBE SCRIPT ############################################################################


    console.log("trimmed title =", trimTitle(productDetails));

    const args = [
        `--file=${downloadPath}`,
        `--title=${trimTitle(productDetails)} ${productDetails.affiliateLink}`,
        `--description=${descriptionResponse.choices[0].message.content.replace(/"/g, '')} ${productDetails.affiliateLink}`,
        `--keywords=${tagsResponse.choices[0].message.content.replace(/"/g, '')}`,
        '--privacyStatus=public'
    ];



    const script = "../../upload_video.py";
    runPythonScript(script, args);


}

module.exports = { fetchChatCompletions };