## Installation Guide

Follow these steps to set up your environment and start using the project.
Prerequisites

Before you begin, ensure you have met the following requirements:

You have a working installation of Node.js and npm.
You have a basic understanding of Node.js and JavaScript.

# Step 1: Setting up the Environment Variables

Create a .env file in the root directory of your project and include the following environment variables:
    
    OPENAI_API_KEY=your_openai_api_key_here
    AMNZ_EMAIL=your_amazon_email_here
    AMNZ_PW=your_amazon_password_here
    SERP_API_KEY=your_serp_api_key_here

Replace the placeholders with your actual API keys and credentials.

> ***Note:*** *You need to sign up for the Amazon affiliate program to be able to receive affiliate links!*

# Step 2: Configuring YouTube API for Video Uploads

To upload videos to YouTube via this project, you need to set up client_secrets.json in the /src folder:

Visit the Google Cloud Console.
Create a new project or select an existing one.
Navigate to the APIs & Services > Credentials page.
Click Create credentials and choose OAuth client ID.
If prompted, configure the OAuth consent screen.
Select Desktop app as the application type.
Name your OAuth 2.0 client and click Create.
Download the JSON configuration file and rename it to client_secrets.json.
Place client_secrets.json in your project's root directory.

Ensure Python 2 is installed on your system. You can download it from the official Python website.

Create a virtual environment for Python 2:

    python2 -m virtualenv env

Activate the virtual environment:

On Windows:

    .\env\Scripts\activate

On Unix or MacOS:

    source env/bin/activate

Install the necessary Python 2 dependencies within the virtual environment as specified in your project's requirements file.

For a more detailed guide, follow the instructions on Uploading a Video.
# Step 3: Running an Instance of ShortGPT

This project requires a running instance of ShortGPT. To set it up:

Clone the ShortGPT repository from GitHub:


    git clone https://github.com/RayVentura/ShortGPT.git

Navigate into the cloned directory:

bash

    cd ShortGPT

Follow the setup instructions provided in the ShortGPT README to get the service running.

To run Dockerfile do this:
```bash
docker build -t short_gpt_docker_new:latest .
docker run -p 31415:31415 --env-file .env short_gpt_docker_new:latest
```
Export Docker image:
```bash
docker save short_gpt_docker > short_gpt_docker.tar
```

> ***Note:*** *You need also an .env with with following variables for ShortGPT!*

    OPENAI_API_KEY=your_openai_api_key_here
    ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
    PEXELS_API_KEY=your_pexels_api_key

This will install all required dependencies and start the application.
Contributing


## Step 4: Start the Script

To begin processing and uploading videos related to your specified niche, start the `web_agent_5products.js` script. This script is designed to handle 5 products due to the YouTube API's limitation of 5 uploads per day per account.

To start the script, use the following command in your terminal or command prompt, replacing `"nicheName"` with the actual name of your niche. The niche name is used for searching relevant products on Google:


    node web_agent_5products.js "nicheName"

For example, if your niche is "organic teas," you would start the script like this:

    node web_agent_5products.js "organic teas"

This command initiates the process of gathering information on 5 products within the "organic teas" niche, preparing content for them, and uploading the related videos to YouTube, adhering to the daily upload limit imposed by the YouTube API.

