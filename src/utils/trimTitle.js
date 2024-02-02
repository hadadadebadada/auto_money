 /**
 * Trims the title in a given JSON object to a maximum of 76 characters. If the title is longer than 76 characters,
 * it attempts to truncate at the last space within that limit to avoid cutting words in half. This function modifies
 * the original JSON object by updating the `title` property with the trimmed version.
 *
 * @param {object} jsonObj - The JSON object containing the `title` property to be trimmed.
 * @returns {string} The trimmed title. If the original title was less than or equal to 76 characters, it is returned unchanged.
 *                   If the title was longer, it is truncated to either 76 characters or to the last space before that limit.
 */

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

module.exports = {trimTitle};

