const fs = require('fs');

const extractText = data => data.text();
const extractTrimmed = data => data.trim();
const extractTextTrimmed = data => extractText(data).trim();

/**
 * Writes data arr to json file
 * @param  {Array} data
 * @param  {string} filename
 * @return {None}
 */
const writeJson = (data, filename) => {
    const num_whitespace = 4;
    const jsonData = JSON.stringify(data, null, num_whitespace)
    fs.writeFile(filename, jsonData, err => {
      if(err)
          console.log(err)
    });
}

module.exports = {
    writeJson, 
    extractTrimmed,
    extractText,
    extractTextTrimmed 
}