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
    let i = 0;
    while(true){
        const nameContainer = names[i];
        if(nameContainer){
            let name = extractTrimmed(nameContainer.children[1].children[0].data);
            name = name.substr(0, name.length-2);
            const street = extractTrimmed(infos[i].children[3].children[3].children[0].data);
            const townZip = extractTrimmed(infos[i].children[3].children[3].children[2].data);
            const [zipCode, town] = townZip.split(' ');
            const location = { street, town, zipCode };
            const phone = extractTrimmed(infos[i].children[5].children[3].children[0].data);
            restaurants.push({ name, phone, location })
        }
        else 
            break;
        i++;
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
const get = async(withWrite=false) => {
  const totalRestaurants = await allRestaurants();
  if(withWrite)
        writeJson(totalRestaurants, "./server/maitreRestaurants.json");
  return totalRestaurants;
};



module.exports = { 
  get
}

_ = get();
