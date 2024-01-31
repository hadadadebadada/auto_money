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

module.exports = trimTitle;