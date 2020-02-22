const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

/**
 * Method to filter restaurants out of all the available ones
 * @param  {Object} restaurant
 * @param  {string} distinction
 * @param  {string} cooking
 * @param  {string} query
 * @return {boolean} Should the array include the restaurant
 */
const filterRestaurants = (restaurant, distinction, cooking, query) => {
  const {
    distinction: { type },
    name,
    cookingType
  } = restaurant;
  return (
    type === distinction &&
    (cooking === cookingType || cooking === "Toutes cuisines") &&
    (name.includes(query) || query === "")
  );
};

/**
 * Method to filter restaurants out of all the available ones
 * @param  {Object} restaurant1
 * @param  {Object} restaurant1
 * @param  {string} sorting criteria
 * @return {number} how r1 is positionned relative to r2
 */
const sortRestaurants = (r1, r2, sortingFilter, userLocation) => {
  if (sortingFilter === "Trier par distance" && userLocation) {
    const { lat, long } = userLocation;
    const { latitude: latitude1, longitude: longitude1 } = r1 || {};
    if (latitude1 === null || longitude1 === null) return 1;
    const { latitude: latitude2, longitude: longitude2 } = r2 || {};
    if (latitude2 === null || longitude2 === null) return -1;
    const d1 = Math.sqrt(
      Math.pow(latitude1 - lat, 2) + Math.pow(longitude1 - long, 2)
    );
    const d2 = Math.sqrt(
      Math.pow(latitude2 - lat, 2) + Math.pow(longitude2 - long, 2)
    );
    return d1 > d2 ? 1 : -1;
  }
  if (sortingFilter === "Trier par note décroissante") {
    const { rating: rating1 } = r1;
    const { rating: rating2 } = r2;
    return rating1 > rating2 ? -1 : 1;
  }
  if (sortingFilter === "Trier par note croissante") {
    const { rating: rating1 } = r1;
    const { rating: rating2 } = r2;
    return rating1 > rating2 ? 1 : -1;
  }
  if (sortingFilter === "Trier par prix croissant") {
    const {
      price: { bottom: bottom1, top: top1 }
    } = r1;
    const {
      price: { bottom: bottom2, top: top2 }
    } = r2;
    return (top1 + bottom1) / 2 > (top2 + bottom2) / 2 ? 1 : -1;
  }
  if (sortingFilter === "Trier par prix décroissant") {
    const {
      price: { bottom: bottom1, top: top1 }
    } = r1;
    const {
      price: { bottom: bottom2, top: top2 }
    } = r2;
    return (top1 + bottom1) / 2 > (top2 + bottom2) / 2 ? -1 : 1;
  }
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/restaurants", (req, res) => {
  const {
    distinction: { value: distinctionValue },
    cooking: { value: cookingValue },
    sorting: { value: sortingValue },
    userLocation,
    query
  } = req.body;
  const allRestaurants = JSON.parse(
    fs.readFileSync(path.join(__dirname, "goldenRestaurants.json"))
  );
  const filteredRestaurants = allRestaurants.filter(restaurant =>
    filterRestaurants(restaurant, distinctionValue, cookingValue, query)
  );
  filteredRestaurants.sort((a, b) =>
    sortRestaurants(a, b, sortingValue, userLocation)
  );
  res.send(JSON.stringify(filteredRestaurants));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
