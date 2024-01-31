 async function sleep(milliseconds) {
    return await new Promise((r, _) => {
        setTimeout(() => {
            r();
        }, milliseconds);
    });
}

 async function waitForEvent(page, event) {
    return page.evaluate(event => {
        return new Promise((r, _) => {
            document.addEventListener(event, function (e) {
                r();
            });
        });
    }, event)
}


module.exports = { sleep, waitForEvent };