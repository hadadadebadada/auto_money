Installation Guide

Follow these steps to set up your environment and start using the project.
Prerequisites

Before you begin, ensure you have met the following requirements:

    You have a working installation of Node.js and npm.
    You have a basic understanding of Node.js and JavaScript.

Step 1: Setting up the Environment Variables

Create a .env file in the root directory of your project and include the following environment variables:

plaintext

OPENAI_API_KEY=your_openai_api_key_here
AMNZ_EMAIL=your_amazon_email_here
AMNZ_PW=your_amazon_password_here
SERP_API_KEY=your_serp_api_key_here

Replace the placeholders with your actual API keys and credentials.
Step 2: Configuring YouTube API for Video Uploads

To upload videos to YouTube via this project, you need to set up client_secrets.json:

    Visit the Google Cloud Console.
    Create a new project or select an existing one.
    Navigate to the APIs & Services > Credentials page.
    Click Create credentials and choose OAuth client ID.
    If prompted, configure the OAuth consent screen.
    Select Desktop app as the application type.
    Name your OAuth 2.0 client and click Create.
    Download the JSON configuration file and rename it to client_secrets.json.
    Place client_secrets.json in your project's root directory.

For a more detailed guide, follow the instructions on Uploading a Video.
Step 3: Running an Instance of ShortGPT

This project requires a running instance of ShortGPT. To set it up:

    Clone the ShortGPT repository from GitHub:

    bash

git clone https://github.com/RayVentura/ShortGPT.git

Navigate into the cloned directory:

bash

    cd ShortGPT

    Follow the setup instructions provided in the ShortGPT README to get the service running.

Starting the Project

After completing the setup steps, you can start the project by running:

bash

npm install
npm start

This will install all required dependencies and start the application.
Contributing

Contributions are welcome! For major changes, please open an issue first to discuss what you would like to change.
License

Include your project's license information here.
