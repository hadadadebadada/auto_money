
/**
 * Highlights all clickable elements on a web page and marks them with a custom attribute.
 * This function will iterate over all anchor tags, buttons, inputs, textareas, and elements
 * with a role of button or treeitem. It removes a specific attribute (`gpt-link-text`) if present,
 * outlines visible and interactable elements with a red border, and sets a `gpt-link-text` attribute
 * with a sanitized version of the element's text content. This is useful for visually identifying
 * clickable elements and potentially for further processing or testing scenarios.
 *
 * @async
 * @param {object} page - The Puppeteer page object representing the web page to interact with.
 * @returns {Promise<void>} A promise that resolves when the operation completes, marking all identified
 *                          clickable elements with a red border and a `gpt-link-text` attribute.
 */


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

module.exports = { highlight_links };
