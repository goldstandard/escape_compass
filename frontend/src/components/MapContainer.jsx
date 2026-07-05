import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SOURCE_ID = "country-boundaries-source";
const FILL_LAYER_ID = "country-highlight-fill";
const LINE_LAYER_ID = "country-highlight-line";

// Seed dataset currently focuses on this country subset, so centroids are kept explicit for smooth camera jumps.
const COUNTRY_CENTERS = {
  ARE: [54.3, 23.6],
  AUS: [134.5, -25.7],
  CAN: [-106.3, 56.1],
  CHL: [-71.5, -35.7],
  CRI: [-84.2, 9.9],
  CZE: [15.3, 49.8],
  ESP: [-3.7, 40.4],
  EST: [25.0, 58.7],
  ISL: [-19.0, 64.9],
  JPN: [138.2, 36.2],
  NZL: [174.7, -41.2],
  PRT: [-8.2, 39.4],
  SGP: [103.8, 1.35],
  CHE: [8.2, 46.8],
  THA: [100.9, 15.8],
  URY: [-55.8, -32.6],
  USA: [-98.6, 39.8],
};

function getCameraPadding() {
  if (typeof window === "undefined") {
    return { top: 28, bottom: 180, left: 12, right: 12 };
  }

  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    return { top: 24, bottom: 170, left: 10, right: 10 };
  }

  return { top: 34, bottom: 220, left: 16, right: 16 };
}

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

function geometryToBounds(geometry) {
  if (!geometry?.coordinates) {
    return null;
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function visit(node) {
    if (!Array.isArray(node)) {
      return;
    }

    if (typeof node[0] === "number" && typeof node[1] === "number") {
      const [lng, lat] = node;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      return;
    }

    node.forEach(visit);
  }

  visit(geometry.coordinates);

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return null;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

function MapContainer({ activeCountries, topRecommendations }) {
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [selectedIso3, setSelectedIso3] = useState("");

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const normalizedCountries = useMemo(
    () => Array.from(new Set((activeCountries || []).map((iso) => iso.toUpperCase()))),
    [activeCountries]
  );

  function focusCountry(iso3) {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      return;
    }

    setSelectedIso3(iso3);

    const predefined = COUNTRY_CENTERS[iso3];
    if (predefined) {
      map.flyTo({
        center: predefined,
        zoom: 3,
        duration: 1200,
        essential: true,
      });
      return;
    }

    const features = map.querySourceFeatures(SOURCE_ID, {
      sourceLayer: "country_boundaries",
      filter: ["==", ["coalesce", ["get", "iso_3166_1_alpha_3"], ["get", "iso_3166_1"]], iso3],
    });

    if (!features.length) {
      return;
    }

    const bounds = geometryToBounds(features[0].geometry);
    if (!bounds) {
      return;
    }

    map.fitBounds(bounds, {
      padding: getCameraPadding(),
      duration: 1200,
      maxZoom: 4,
      essential: true,
    });
  }

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
      center: [11, 24],
      zoom: 1.25,
      pitch: 28,
      antialias: true,
      projection: "globe",
      padding: getCameraPadding(),
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

    const handleResize = () => {
      map.setPadding(getCameraPadding());
    };

    window.addEventListener("resize", handleResize);

    mapRef.current = map;
    return () => {
      window.removeEventListener("resize", handleResize);
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

      <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/85 p-3 text-xs text-deep shadow">
        <p className="mb-1 font-semibold">Top recommendations</p>
        <div className="flex flex-wrap gap-2">
          {topRecommendations.slice(0, 5).map((item) => (
            <button
              key={item.iso3}
              type="button"
              onClick={() => focusCountry(item.iso3)}
              className={`rounded-full px-2 py-1 font-medium transition ${
                selectedIso3 === item.iso3
                  ? "bg-calm text-white"
                  : "bg-calm/15 text-calm hover:bg-calm/25"
              }`}
            >
              {item.country} ({item.score})
            </button>
          ))}
          {topRecommendations.length === 0 && <span>No recommendation yet.</span>}
        </div>
      </div>
    </div>
  );
}

export default MapContainer;
