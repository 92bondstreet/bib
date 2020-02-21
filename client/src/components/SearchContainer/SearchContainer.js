import React from "react";
import "./SearchContainer.css";
import chef_empty from "../../assets/empty_chef.png";
import bib_maitre_logo from "../../assets/bib_maitre_logo.png";
import Select from "react-select";

import {
  distinctionOptions,
  cookingOptions,
  sortingOptions,
  selectStyles
} from "../../Constants";

import { Restaurant, SkeletonRestaurant } from "../Restaurant";
import SearchInput from "../SearchInput";

const SearchContainer = ({ filters, setFilters, loading, restaurants }) => {
  const renderLogo = () => (
    <div className="logo-container">
      <img
        alt="Michelin Bib Gourmand Maître Restaurateur"
        src={bib_maitre_logo}
        className="logo"
      />
    </div>
  );

  const renderInput = () => (
    <SearchInput
      inputValue={filters.query}
      setInputValue={query => setFilters({ ...filters, query })}
    />
  );

  const renderFilters = () => (
    <div className="filters-container">
      <Select
        options={distinctionOptions}
        value={filters.distinction}
        placeholder={distinctionOptions[0].label}
        isSearchable={false}
        styles={selectStyles}
        onChange={distinction =>
          distinction !== filters.distinction &&
          setFilters({
            ...filters,
            distinction
          })
        }
      />
      <Select
        options={cookingOptions}
        value={filters.cooking}
        noOptionsMessage={() => "Aucun type de cuisine correspondant"}
        placeholder={cookingOptions[0].label}
        styles={selectStyles}
        onChange={cooking =>
          cooking !== filters.cooking && setFilters({ ...filters, cooking })
        }
      />
      <Select
        options={sortingOptions}
        value={filters.sorting}
        placeholder={sortingOptions[0].label}
        isSearchable={false}
        styles={selectStyles}
        onChange={sorting =>
          sorting !== filters.sorting && setFilters({ ...filters, sorting })
        }
      />
    </div>
  );

  const renderRestaurants = () => (
    <div className="restaurant-wrapper">
      {loading
        ? [null, null, null].map((_, i) => <SkeletonRestaurant key={i} />)
        : restaurants.length === 0
        ? renderEmptyChef()
        : restaurants.map(r => <Restaurant key={r._id} content={r} />)}
    </div>
  );

  const renderEmptyChef = () => (
    <div className="logo-container">
      <img alt="Empty results" src={chef_empty} className="empty-logo" />
      <p className="empty-text">
        Aucun restaurant trouvé, vous êtes trop gourmand!
      </p>
    </div>
  );

  return (
    <div className="search-container">
      {renderLogo()}
      {renderInput()}
      {renderFilters()}
      {renderRestaurants()}
    </div>
  );
};

export default SearchContainer;
