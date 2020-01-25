const cheerio = require('cheerio');
const axios = require('axios');
const utils = require('utils')
const { writeJson, scrapeUrl, extractText, extractTrimmed, extractTextTrimmed } = utils;

const BASE_URL = "https://guide.michelin.com/fr/fr/restaurants/3-etoiles-michelin/2-etoiles-michelin/1-etoile-michelin/bib-gourmand/page/";

/**
 * Parse entire Restaurant page
 * @param  {Object} data
 * @return {Object} representing restaurant's data
 */
const parseRestaurant = data => {
    const $ = cheerio.load(data);
    const name = extractName($('.restaurant-details__heading--title'));
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
    for(let i = 0; i < 20; i++){
        const container = $(`div[data-index=${i}]`);
        const nameContainer = container['0'].children[3];
        const nameTag = nameContainer.children[3].children[1].children[0];
        const restaurantUrl = `https://guide.michelin.com${nameTag.parent.attribs['href']}`;
        console.log(restaurantUrl, i)
        const restaurantData = await scrapeUrl(restaurantUrl, parseRestaurant);
        restaurants.push(restaurantData)
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
      const url = `https://guide.michelin.com/fr/fr/restaurants/3-etoiles-michelin/2-etoiles-michelin/1-etoile-michelin/bib-gourmand/page/${index}`;
      const pageRestaurants = await scrapeUrl(url, parseRestaurantsPage);
      if(pageRestaurants.length === 0)
          break
      restaurants = [...restaurants, ...pageRestaurants];
    //   console.log(restaurants[restaurants.length-1], index)
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
  writeJson(totalRestaurants, "./server/maitreRestaurants.json");
  return totalRestaurants;
};

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
  get
}

_ = get();
