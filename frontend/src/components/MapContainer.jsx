import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SOURCE_ID = "country-boundaries-source";
const FILL_LAYER_ID = "country-highlight-fill";
const LINE_LAYER_ID = "country-highlight-line";

function buildOpacityExpression(activeCountries) {
  return [
    "case",
    [
      "in",
      ["coalesce", ["get", "iso_3166_1_alpha_3"], ["get", "iso_3166_1"]],
      ["literal", activeCountries],
    ],
    0.82,
    0.08,
  ];
}

function buildColorExpression(activeCountries) {
  return [
    "case",
    [
      "in",
      ["coalesce", ["get", "iso_3166_1_alpha_3"], ["get", "iso_3166_1"]],
      ["literal", activeCountries],
    ],
    "#2f7e79",
    "#6b7280",
  ];
}

function ensureLayers(map, activeCountries) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
    });
  }

  if (!map.getLayer(FILL_LAYER_ID)) {
    map.addLayer({
      id: FILL_LAYER_ID,
      type: "fill",
      source: SOURCE_ID,
      "source-layer": "country_boundaries",
      paint: {
        "fill-color": buildColorExpression(activeCountries),
        "fill-opacity": buildOpacityExpression(activeCountries),
        "fill-opacity-transition": { duration: 450, delay: 0 },
      },
    });
  }

  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: "line",
      source: SOURCE_ID,
      "source-layer": "country_boundaries",
      paint: {
        "line-color": "#1f2937",
        "line-opacity": 0.35,
        "line-width": 0.35,
      },
    });
  }
}

function MapContainer({ activeCountries, topRecommendations }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapError, setMapError] = useState("");

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const normalizedCountries = useMemo(
    () => Array.from(new Set((activeCountries || []).map((iso) => iso.toUpperCase()))),
    [activeCountries]
  );

  useEffect(() => {
    if (!token || !mapContainerRef.current || mapRef.current) {
      if (!token) {
        setMapError("Mapbox token is missing, so the live map is shown in fallback mode.");
      }
      return;
    }

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [11, 20],
      zoom: 1.25,
      pitch: 28,
      antialias: true,
      projection: "globe",
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.on("error", () => {
      setMapError("Mapbox could not load properly, so the live map is shown in fallback mode.");
    });

    map.on("style.load", () => {
      map.setFog({
        color: "rgb(247, 252, 255)",
        "horizon-blend": 0.07,
      });
      setMapError("");
      ensureLayers(map, normalizedCountries);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token, normalizedCountries]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer(FILL_LAYER_ID)) {
      return;
    }

    map.setPaintProperty(FILL_LAYER_ID, "fill-opacity", buildOpacityExpression(normalizedCountries));
    map.setPaintProperty(FILL_LAYER_ID, "fill-color", buildColorExpression(normalizedCountries));
  }, [normalizedCountries]);

  if (!token || mapError) {
    return (
      <div className="flex h-full min-h-[420px] flex-col justify-between rounded-2xl border border-white/60 bg-white p-5 shadow-panel">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {mapError || "Missing Mapbox token. Create frontend/.env with VITE_MAPBOX_TOKEN."}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-deep/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-deep/60">Active countries</p>
            <p className="mt-2 text-3xl font-bold text-deep">{normalizedCountries.length}</p>
            <p className="mt-1 text-sm text-deep/70">The shortlist is still computed even without the live map.</p>
          </div>

          <div className="rounded-2xl bg-calm/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-deep/60">Top recommendations</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {topRecommendations.slice(0, 5).map((item) => (
                <span key={item.iso3} className="rounded-full bg-white px-3 py-1 text-sm font-medium text-deep shadow-sm">
                  {item.country} ({item.score})
                </span>
              ))}
              {topRecommendations.length === 0 && <span className="text-sm text-deep/70">No recommendation yet.</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-white/60 bg-white shadow-panel">
      <div ref={mapContainerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-white/85 px-3 py-2 text-xs text-deep shadow">
        <div className="font-semibold">Active countries: {normalizedCountries.length}</div>
        <div className="mt-1 text-deep/70">Live filtering and fade-out enabled</div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 rounded-xl bg-white/85 p-3 text-xs text-deep shadow">
        <p className="mb-1 font-semibold">Top recommendations</p>
        <div className="flex flex-wrap gap-2">
          {topRecommendations.slice(0, 5).map((item) => (
            <span key={item.iso3} className="rounded-full bg-calm/15 px-2 py-1 font-medium text-calm">
              {item.country} ({item.score})
            </span>
          ))}
          {topRecommendations.length === 0 && <span>No recommendation yet.</span>}
        </div>
      </div>
    </div>
  );
}

export default MapContainer;
