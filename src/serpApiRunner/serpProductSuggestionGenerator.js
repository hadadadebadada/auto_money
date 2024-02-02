const SerpApi = require('google-search-results-nodejs');
const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);


/**
 * Generates product suggestions based on a given niche name by querying Google Search via the SerpApi.
 * This function constructs a search query with the niche name, performs the search, and then extracts
 * product names from the search results. It returns an array of product names or an empty array if no
 * products are found or if an error occurs during the search.
 *
 * @async
 * @param {string} nicheName - The name of the niche to generate product suggestions for.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of product names related to the niche,
 *                                   or an empty array if the search fails or no products are found.
 */

 async function generateProductSuggestions(nicheName) {


    // add open ai to create random/ similar niche names 



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