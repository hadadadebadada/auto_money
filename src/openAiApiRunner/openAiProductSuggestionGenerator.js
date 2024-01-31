//#####################################      generate product suggestions with openai     #########################################################

// async function generateProductSuggestions(nicheName) {
//     const promptTemplate = `Generate a concise list of popular product names in the ${nicheName} niche. Please focus solely on providing unique and catchy product names that are currently trending in this market.`;

//     try {
//         const productsResponse = await openai.chat.completions.create({
//             messages: [
//                 { "role": "system", "content": promptTemplate },
//                 { "role": "user", "content": "Generate 25 product names." }
//             ],
//             model: "gpt-3.5-turbo",
//         });

//         console.log("productsResponse", productsResponse.choices[0].message)
//         console.log("productsResponse1", productsResponse.choices[0].message.content)

//         if (!productsResponse || !productsResponse.choices) {
//             console.error('Invalid response from API:', productsResponse);
//             return [];
//         }

//         // Extracting the content from the response
//         const messageContent = productsResponse.choices[0].message.content;

//         if (!messageContent) {
//             console.error('No content in response:', productsResponse);
//             return [];
//         }

//         const products = messageContent.split('\n');

//         console.log("products", products)

//         console.log("filtered products", products.filter(product => product.trim() !== '') )

//         return products.filter(product => product.trim() !== ''); // Filter out empty lines
//     } catch (error) {
//         console.error('Error calling OpenAI API:', error);
//         return [];
//     }
// }