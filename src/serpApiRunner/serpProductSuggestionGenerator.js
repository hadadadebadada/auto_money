const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);

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

        if (!productsResponse || !productsResponse.organic_results) {
            console.error('Invalid response from API:', productsResponse);
            return [];
        }

        // Extract product names from the response
        const products = productsResponse.organic_results.map(result => result.title);

        return products.filter(product => product.trim() !== ''); // Filter out empty lines
    } catch (error) {
        console.error('Error calling SerpApi:', error);
        return [];
    }
}

module.exports = { generateProductSuggestions };