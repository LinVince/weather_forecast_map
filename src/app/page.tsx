"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Box, CircularProgress, Typography } from "@mui/material";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAP_API;
const GOOGLE_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID;
const INITIAL_VIEW_STATE = {
  latitude: 25.02434493613632,
  longitude: 121.53592051950127,
  zoom: 16,
  pitch: 1,
  bearing: 0,
  transitionDuration: 1000,
};

interface LocationData {
  latitude: number;
  longitude: number;
  placeID: string;
}

function GoogleMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const mapRef = useRef(null);
  const googleMapInstance = useRef<any>(null);

  const loader = new Loader({
    apiKey: GOOGLE_MAPS_API_KEY || "",
    libraries: ["places", "maps"],
    version: "weekly",
  });

  useEffect(() => {
    if (locationData) {
      setViewState({
        ...viewState,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
    } else {
      setViewState(INITIAL_VIEW_STATE);
    }
  }, [locationData]);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const { Map } = await loader.importLibrary("maps");

        const mapOptions = {
          center: { lat: viewState.latitude, lng: viewState.longitude },
          zoom: viewState.zoom,
          mapId: GOOGLE_MAP_ID,
          mapTypeControl: false,
          streetViewControl: false,
          tilt: 45,
        };

        googleMapInstance.current = new Map(mapRef.current, mapOptions);

        googleMapInstance.current.addListener("click", async (event: any) => {
          const latitude = event.latLng.lat();
          const longitude = event.latLng.lng();
          const placeID = event.placeId;

          setLocationData({ latitude, longitude, placeID });
          googleMapInstance.current.panTo({ lat: latitude, lng: longitude });
        });
      } catch (error) {
        console.error("Error loading Google Maps", error);
      }
    };
    loadMap();
  }, []);

  useEffect(() => {
    if (googleMapInstance.current) {
      googleMapInstance.current.panTo({
        lat: viewState?.latitude,
        lng: viewState?.longitude,
      });
    }
  }, [viewState]);

  return (
    <>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100vh", position: "relative" }}
      />
      <Box sx={{ position: "absolute", index: 0, top: 0, left: 0 }}>
        {locationData ? (
          <Weather
            longitude={locationData.longitude}
            latitude={locationData.latitude}
          />
        ) : (
          <Box sx={{ p: 2, backgroundColor: "#fff" }}>
            Select a place for weather forecast
          </Box>
        )}
      </Box>
    </>
  );
}

import axios from "axios";
import { error } from "console";

function Weather({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}) {
  const [weatherInfo, setWeatherInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const isValidLongitude = longitude >= -180 && longitude <= 180;
    const isValidLatitude = latitude >= -90 && latitude <= 90;

    if (!isValidLongitude || !isValidLatitude) {
      throw new Error(
        `Invalid coordinates: Longitude must be between -180 and 180, and Latitude must be between -90 and 90.`
      );
    }

    const fetchWeatherData = async () => {
      setIsLoading(true);

      const params = {
        latitude: latitude,
        longitude: longitude,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
        timezone: "auto",
      };

      const url = "https://api.open-meteo.com/v1/forecast";

      try {
        const response = await axios.get(url, { params });
        const data = response.data;

        if (!data || !data.daily) {
          throw new Error("Daily data not found in the response");
        }

        setWeatherInfo(data.daily);
      } catch (error) {
        console.log("Error fetching weather data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();
  }, [longitude, latitude]);

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid #ccc",
        borderRadius: "8px",
        maxWidth: "500px",
        backgroundColor: "#f9f9f9",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Weekly Weather Forecast of the Selected Place
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : weatherInfo ? (
        weatherInfo.time.map((date: any, i: number) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              mb: 1,
              p: 1,
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography variant="body1" sx={{ minWidth: "12ch" }}>
              {date}
            </Typography>
            <Typography variant="body1" sx={{ minWidth: "15ch" }}>
              {weatherInfo.temperature_2m_min[i].toFixed(1)}°C ~{" "}
              {weatherInfo.temperature_2m_max[i].toFixed(1)}°C
            </Typography>
            <Typography variant="body1" sx={{ minWidth: "15ch" }}>
              Precipitation: {weatherInfo.precipitation_sum[i].toFixed(1)} mm
            </Typography>
          </Box>
        ))
      ) : (
        <Typography variant="body2">Select a place on the map</Typography>
      )}
    </Box>
  );
}

export default function RenderDom() {
  return (
    <>
      <GoogleMap />
    </>
  );
}
