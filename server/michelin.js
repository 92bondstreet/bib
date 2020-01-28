const cheerio = require('cheerio');
const axios = require('axios');
const utils = require('./utils');
const fs = require('fs');
const { writeJson, extractText, extractTrimmed, extractTextTrimmed } = utils;

const BASE_URL = "https://guide.michelin.com/fr/fr/restaurants/3-etoiles-michelin/2-etoiles-michelin/1-etoile-michelin/bib-gourmand/page/";

/**
 * Scrape a given url
 * @param  {String}  url
 * @return {Function} callback with data
 */
const scrapeUrl = async(url, callback) => {
    const response = await axios.get(url);
    const { data, status } = response;
    if (status >= 200 && status < 300)
        return callback(data);
    return [];
}


/**
 * Extract price from unformatted text
 * @param  {String} text
 * @return {Object} representing price and cooking type of restaurant
 */
const extractPriceAndCookingType = text => {
    text = text.trim();
    let [priceText, cookingType] = text.split('•');
    priceText = priceText.replace(/\s+/g, " ");
    cookingType = cookingType.replace(/\s+/g, " ");
    priceText = priceText.substr(0, priceText.length-1);
    const [bottom, _, top] = priceText.split(' ');
    const price = { bottom, top };
    cookingType = cookingType.substr(0, cookingType.length);
    return { price, cookingType };
}

/**
 * Extract location from dict of html text
 * @param  {Array} locationKeys
 * @param  {Object} locationContainer
 * @return {Object} representing the location of the restaurant
 */
const extractLocation = (locationKeys, locationContainer) => {
    let location;
    for(let i = 0; i < locationKeys.length; i++){
        const key = locationKeys[i];
        const attributes = locationContainer[key].attribs;
        if(Object.keys(attributes).length === 0){
            location = locationContainer[key].children[1].data;
            break;
        }
    }
    // converting to object
    const splitted = location.split(', ');
    const [street, town, zipCode, ..._] = splitted;
    return { street, town, zipCode };
}

/**
 * Extract Distinction from cheerio Object
 * @param  {Object} cheerioData
 * @return {Object} representing the type and description of distinction
 */
const extractDistinction = cheerioData => {
    let type = "NONE";
    let description = "";
    if(cheerioData.length !== 0){
        const text = extractTrimmed(cheerioData['0'].children[1].children[2].data);
        const splitted = text.split(' • ');
        type = getDistinctionType(splitted[0])
        description = splitted[1]
    }
    return { type, description };
}

/**
 * Gets Distinctiont type
 * @param  {string} typeText
 * @return {string} representing the type of distinction
 */
const getDistinctionType = typeText => {
    if(typeText === "Trois étoiles")
        return "THREE_STARS"
    else if(typeText === "Deux étoiles")
        return "TWO_STARS"
    else if(typeText === "Une étoile")
        return "ONE_STAR"
    else return "BIB_GOURMAND"
}

/**
 * Extract Number of votes for rating, if any
 * @param  {Object} cheerioData
 * @return {number} representing Number of votes for given rating
 */
const extractNumVotes = cheerioData => {
    if(cheerioData.length !== 0){
        const text = extractTextTrimmed(cheerioData);
        return parseInt(text.substr(0, text.length-5));
    }
    return 0;
}

/**
 * Extract rating, if any
 * @param  {Object} cheerioData
 * @return {number} representing rating of restaurant
 */
const extractAverageRating = cheerioData => {
    if(cheerioData.length !== 0){
        const text = extractTrimmed(cheerioData['0'].children[0].data);
        return parseFloat(text.substr(14, text.length-18).replace(",", "."))
    }
    return 0.0;
}   

/**
 * Extract website url, if any
 * @param  {Object} cheerioData
 * @return {string} representing website url of restaurant
 */
const extractWebsiteUrl = cheerioData => {
    if(cheerioData.length !== 0)
        return cheerioData.attr('href');
    return "";
}

/**
 * Extract restaurant name 
 * @param  {Object} cheerioData
 * @return {string} representing name of restaurant
 */
const extractName = cheerioData => cheerioData['0'].children[0].data;


/**
 * Extract restaurant imageUrl 
 * @param  {Object} cheerioData
 * @return {string} representing url of restaurant img
 */
const extractImageUrl = cheerioData => cheerioData[0].attribs['data-image'];

/**
 * Parse entire Restaurant page
 * @param  {Object} data
 * @return {Object} representing restaurant's data
 */
const parseRestaurant = data => {
    const $ = cheerio.load(data);
    const name = extractName($('.restaurant-details__heading--title'));
    const imageUrl = extractImageUrl($('.masthead__gallery-image-item'));
    const locationContainer = $('.restaurant-details__heading--list > li');
    const locationKeys = Object.keys(locationContainer);
    let location = extractLocation(locationKeys, locationContainer);
    const rating = extractAverageRating($('.restaurant-details__heading--rating'));
    const numberVotes = extractNumVotes($('a[href=#review-section]'));
    const { price, cookingType } = extractPriceAndCookingType($('.restaurant-details__heading-price')['0'].children[0].data);
    const phone = extractText($('span[x-ms-format-detection=none]'));
    const websiteUrl = extractWebsiteUrl($('a[data-event=CTA_website]'));
    const distinction = extractDistinction($('.restaurant-details__classification--list'));
    return {
        name, 
        imageUrl,
        cookingType,
        distinction,
        websiteUrl,
        phone,
        price,
        numberVotes,
        rating,
        location
    }
}

/**
 * Parse entire Restaurants for every distinction (1S, 2S, 3S, BIB)
 * @param  {Object} data
 * @return {Array} representing restaurants for those distinctions
 */
const parseRestaurantsPage = async data => {
    const $ = cheerio.load(data);
    // if no results on page
    const noResults = $('.no-results-container');
    if (noResults.length > 0)
        return []
    let restaurants = [];
    let i = 0;
    while(true){
        const container = $(`div[data-index=${i}]`);
        if(container.length === 0)
            break;
        const nameContainer = container['0'].children[3];
        const nameTag = nameContainer.children[3].children[1].children[0];
        const michelinUrl = `https://guide.michelin.com${nameTag.parent.attribs['href']}`;
        console.log(michelinUrl, i);
        const restaurantData = await scrapeUrl(michelinUrl, parseRestaurant);
        restaurants.push({ ...restaurantData, michelinUrl });
        i++;
    }
    return restaurants;
}

/**
 * Get all France located restaurants with either 1Star, 2Stars, 3Stars or BibG distinction
 * @return {Array} restaurants
 */
const allRestaurants = async() => {
  let index = 1;
  let restaurants = [];
  while(true){
      const url = `${BASE_URL}${index}`;
      const pageRestaurants = await scrapeUrl(url, parseRestaurantsPage);
      if(pageRestaurants.length === 0)
          break
      restaurants = [...restaurants, ...pageRestaurants];
      console.log(restaurants[restaurants.length-1], index)
      index++;
  }
  return restaurants;
}

/**
 * Get all France located Bib Gourmand restaurants
 * @return {Array} restaurants
 */
const get = async() => {
  const totalRestaurants = await allRestaurants();
  writeJson(totalRestaurants, "./server/allRestaurantz.json");
  const bibRestaurants = totalRestaurants.filter(r => r.distinction.type === "BIB_GOURMAND");
  writeJson(bibRestaurants, "./server/bibRestaurantz.json");
  return bibRestaurants;
};


module.exports = { 
  get
}

_ = get();
