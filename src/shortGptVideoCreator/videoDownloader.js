// tryed to encapsulate the download function, but it didnt work


// async function downloadVideo(page, linkXPath, sanitizedProductName) {
//     try {
//         const links = await page.$x(linkXPath);
//         let downloadPath = "";

//         if (links.length > 0) {
//             // Extract the video source URL
//             const videoSrc = await page.evaluate(el => el.getAttribute('href'), links[0]);

//             if (videoSrc) {
//                 // Define download path
//                 const fileName = videoSrc.split('/').pop();
//                 downloadPath = path.resolve(__dirname, `productInformation/${sanitizedProductName}/${fileName}`);

//                 // Ensure download directory exists
//                 if (!fs.existsSync(path.dirname(downloadPath))) {
//                     fs.mkdirSync(path.dirname(downloadPath), { recursive: true });
//                 }

//                 // Download the video file
//                 return new Promise((resolve, reject) => {
//                     const file = fs.createWriteStream(downloadPath);
//                     http.get(videoSrc, function (response) {
//                         response.pipe(file);
//                         file.on('finish', function () {
//                             file.close();
//                             console.log(`File downloaded and saved to ${downloadPath}`);
//                             resolve(downloadPath);
//                         });
//                     }).on('error', function (err) {
//                         fs.unlink(downloadPath); // Delete the file on error
//                         console.error('Error during download:', err.message);
//                         reject(err);
//                     });
//                 });
//             } else {
//                 console.log('Video source not found');
//                 return null;
//             }
//         } else {
//             console.log("Download link not found");
//             return null;
//         }
//     } catch (error) {
//         console.error("Error in downloadVideo function:", error);
//         return null;
//     }
// }

// await downloadVideo(page, linkXPath, sanitizedProductName);