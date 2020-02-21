import React, { useState, useEffect } from "react";
import "./MapContainer.css";
import ReactMapGL, { Marker } from "react-map-gl";
import one_marker from "../../assets/1_marker.png";
import two_marker from "../../assets/2_marker.png";
import three_marker from "../../assets/3_marker.png";
import bib_marker from "../../assets/bib_marker.png";
import "./MapContainer.css";
import { defaultMapState } from "../../Constants";

const MapContainer = ({ userLocation, restaurants, setRestaurantsFocus }) => {
  const [state, setState] = useState(defaultMapState);

  useEffect(() => {
    if (userLocation !== null) setViewportUser();
  }, [userLocation]);

  const setViewportUser = () => {
    const viewport = {
      height: "100vh",
      width: "60vw",
      latitude: userLocation.lat,
      longitude: userLocation.long,
      zoom: 13
    };
    setState({ ...state, viewport });
  };

  const renderUserLocation = () => {
    if (userLocation) {
      return (
        <Marker
          latitude={userLocation.lat}
          longitude={userLocation.long}
          offsetLeft={-50}
          offsetTop={-50}
        >
          <div className="container-user-marker">
            <div className="pulsating-marker" />
            <div className="fixed-marker-outline" />
            <div className="fixed-marker" />
          </div>
        </Marker>
      );
    }
    return null;
  };

  const renderRestaurants = () =>
    restaurants.map(
      r =>
        r.latitude &&
        r.longitude && (
          <Marker
            key={r._id}
            latitude={r.latitude}
            longitude={r.longitude}
            offsetLeft={-50}
            offsetTop={-75}
          >
            <div className="container-user-marker">
              <img
                src={getMarker(r.distinction.type)}
                className="marker-restaurant"
                alt="Marker restaurant"
                onClick={() => setRestaurantsFocus(r._id)}
              />
            </div>
          </Marker>
        )
    );

  const getMarker = distinction => {
    if (distinction === "BIB_GOURMAND") return bib_marker;
    if (distinction === "ONE_STAR") return one_marker;
    if (distinction === "TWO_STARS") return two_marker;
    if (distinction === "THREE_STARS") return three_marker;
  };

  return (
    <div className="map-container">
      <ReactMapGL
        {...state.viewport}
        mapStyle="mapbox://styles/mapbox/outdoors-v11"
        onViewportChange={viewport =>
          setState({ ...state, viewport, userLocation })
        }
        mapboxApiAccessToken="pk.eyJ1IjoiYWxleHphamFjIiwiYSI6ImNrNnR2cTh1ZTAzODAzZXA3MTZrMG1vd2MifQ.b7r-Znl2mfjKgkeQDPF8tg"
      >
        {renderUserLocation()}
        {renderRestaurants()}
      </ReactMapGL>
    </div>
  );
};

export default MapContainer;
