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

/**
 * Trim in between space in a string
 * @param  {string} string to trim in between
 * @return  {string} trimmed string
 */
const trimSpace = str => str.replace(/\s+/g, "");

/**
 * Reads json file to data arr
 * @param  {string} filename
 * @return  {Array} data
 */
const readJson = (filename) => JSON.parse(fs.readFileSync(filename, "utf8"));

module.exports = {
    writeJson, 
    readJson,
    extractTrimmed,
    extractText,
    trimSpace,
    extractTextTrimmed 
}