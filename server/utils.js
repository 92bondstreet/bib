const fs = require("fs");

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
  const jsonData = JSON.stringify(data, null, num_whitespace);
  fs.writeFile(filename, jsonData, err => {
    if (err) console.log(err);
  });
};

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
const readJson = filename => JSON.parse(fs.readFileSync(filename, "utf8"));

/**
 * Computes an edit distance between two strings
 * @param {string} first string
 * @param {string} second string
 * @return {double} distance between s1 and s2
 */
const editDistance = (s1, s2) => {
  let costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};
/**
 * Evaluates a distance between two strings
 * @param {string} first string
 * @param {string} second string
 * @return {double} distance between the two strings
 */
const distance = (s1, s2) => {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  let longerLength = longer.length;
  if (longerLength == 0) return 1.0;
  return (
    (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
  );
};

module.exports = {
  writeJson,
  readJson,
  extractTrimmed,
  extractText,
  trimSpace,
  extractTextTrimmed,
  distance
};
