const utils = require("./utils");
const { readJson, writeJson, trimSpace } = utils;

const THRESHOLD_NAME = 0.9;
const THRESHOLD_PHONE = 1;
const THRESHOLD_ADRESS = 0.8;

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

/**
 * Return valid string if property is not defined
 * @return {string} defined string
 */
const validate = str => (str ? str : "");

/**
 * Fits maitre restaurant to standard representation (lowercase etc)
 * @param {string} name
 * @param {string} phone
 * @param {Object} location
 * @return {Object} Formatted object
 */
const normalizeMaitreRestaurant = (name, phone, location) => {
  const formattedMaitreName = trimSpace(validate(name).toLowerCase());
  const formattedMaitrePhone = validate(phone);
  const { town: t, street: s, zipCode: z } = location;
  const town = trimSpace(validate(t).toLowerCase());
  const street = trimSpace(validate(s).toLowerCase());
  const zipCode = trimSpace(validate(z).toLowerCase());
  const formattedMaitreAdress = town + street + zipCode;
  return { formattedMaitreName, formattedMaitrePhone, formattedMaitreAdress };
};

/**
 * Fits bib restaurant to standard representation (lowercase etc)
 * @param {string} name
 * @param {string} phone
 * @param {Object} location
 * @return {Object} Formatted object
 */
const normalizeBibRestaurant = (name, phone, location) => {
  const formattedBibName = trimSpace(validate(name).toLowerCase());
  let formattedBibPhone = validate(phone).substr(4, phone.length - 4);
  formattedBibPhone = "0" + formattedBibPhone;
  const { town: t, street: s, zipCode: z } = location;
  const town = trimSpace(validate(t).toLowerCase());
  const street = trimSpace(validate(s).toLowerCase());
  const zipCode = trimSpace(validate(z).toLowerCase());
  const formattedBibAdress = town + street + zipCode;
  return { formattedBibName, formattedBibPhone, formattedBibAdress };
};

/**
 * Get all France located Bib Gourmand restaurants
 * @return {Array} restaurants
 */
const getGoldenRestaurants = (bibRestaurants, maitreRestaurants) => {
  let results = [];
  bibRestaurants.forEach(bib_r => {
    const { name, phone, location } = bib_r;
    const {
      formattedBibName,
      formattedBibPhone,
      formattedBibAdress
    } = normalizeBibRestaurant(name, phone, location);
    for (let j = 0; j < maitreRestaurants.length; j++) {
      const mai_r = maitreRestaurants[j];
      const { name, phone, location } = mai_r;
      const {
        formattedMaitreName,
        formattedMaitrePhone,
        formattedMaitreAdress
      } = normalizeMaitreRestaurant(name, phone, location);
      // if names have a 90% similitude, or phone are same, or address have a 80%
      if (
        distance(formattedBibName, formattedMaitreName) >= THRESHOLD_NAME ||
        distance(formattedBibPhone, formattedMaitrePhone) >= THRESHOLD_PHONE ||
        distance(formattedBibAdress, formattedMaitreAdress) >= THRESHOLD_ADRESS
      ) {
        results.push(bib_r);
        break;
      }
    }
  });
  return results;
};

/**
 * Get all France located Bib Gourmand restaurants and writes them to json file
 * @return {Array} restaurants
 */
const get = async (withWrite = false) => {
  const bibRestaurants = readJson("./server/bibRestaurants.json");
  const maitreRestaurants = readJson("./server/maitreRestaurants.json");
  const goldenRestaurants = getGoldenRestaurants(
    bibRestaurants,
    maitreRestaurants
  );
  if (withWrite)
    writeJson(goldenRestaurants, "./server/goldenRestaurants.json");
  return goldenRestaurants;
};

module.exports = {
  get
};

_ = get();
