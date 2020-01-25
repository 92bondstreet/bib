const cheerio = require('cheerio');
const axios = require('axios');
const utils = require('./utils');
const iconv = require('iconv-lite');
const qs = require('querystring');
const { writeJson, extractText, extractTrimmed, extractTextTrimmed } = utils;

const BASE_URL = "https://www.maitresrestaurateurs.fr/annuaire/ajax/loadresult";
const BASE_BODY = {
    request_id: "5e9ed33460320b54b43b5c466a53136b",
    annuaire_mode: "standard"
}
const CONFIG = {
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    responseType: 'arraybuffer',
    responseEncoding: 'binary'
}

// this converts iso 8859 encodings to readable format
axios.interceptors.response.use(response => {
    let ctype = response.headers["content-type"];
    if (ctype.includes("charset=ISO-8859-1"))
        response.data = iconv.decode(response.data, 'ISO-8859-1');
    return response;
})

/**
 * Scrape a given url with post request
 * @param  {String}  url
 * @return {Function} callback with data
 */
const scrapeUrl = async page => {
    const response = await axios.post(BASE_URL, qs.stringify({ ...BASE_BODY, page }), CONFIG);
    const { data, status } = response;
    if (status >= 200 && status < 300)
        return parseRestaurantsPage(data);
    return [];
}


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
    const noResults = $('.annuaire_result_list');
    if (noResults.length === 0)
        return []
    let restaurants = [];
    const names = $('.single_libel');
    const infos = $('.single_info3');
    for(let i = 0; i < 10; i++){
        let name = extractTrimmed(names[i].children[1].children[0].data)
        name = name.substr(0, name.length-2);
        const street = extractTrimmed(infos[i].children[3].children[3].children[0].data);
        const townZip = extractTrimmed(infos[i].children[3].children[3].children[2].data);
        const [zipCode, town] = townZip.split(' ');
        const location = { street, town, zipCode };
        const phone = extractTrimmed(infos[i].children[5].children[3].children[0].data);
        restaurants.push({ name, phone, location })
    }
    return restaurants;
}

/**
 * Get all France located restaurants with either 1Star, 2Stars, 3Stars or BibG distinction
 * @return {Array} restaurants
 */
const allRestaurants = async() => {
  let page = 1;
  let restaurants = [];
  while(true){
      const pageRestaurants = await scrapeUrl(page);
      if(pageRestaurants.length === 0)
          break
      restaurants = [...restaurants, ...pageRestaurants];
      console.log(restaurants[restaurants.length-1], page)
      page++;
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



module.exports = { 
  get
}

_ = get();
