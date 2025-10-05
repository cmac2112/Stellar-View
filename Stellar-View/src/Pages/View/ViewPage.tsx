import { useEffect, useRef, useState } from "react";
import {
    Viewer,
    WebMapTileServiceImageryProvider,
    Credit,
    JulianDate,
    Cartesian3,
    Color,
    Ion
} from "cesium";
//import { getFormattedTime} from "./Helpers.tsx";
import Layout from "../../Components/Layout.tsx";
import * as Cesium from "cesium";
const Moon_Layers = {
// All LRO layers are static (temporal: "static")
    lro_wac_global: {
        // Global mosaic compiled from entire mission
        temporal: "static", // No time component
    },
    lro_wac_color: {
        // Color composite - fixed dataset
        temporal: "static",
    },
    lro_lola_elevation: {
        // Elevation map - doesn't change
        temporal: "static",
    },

}
const GIBS_LAYERS = {
    // GOES - 10 MINUTE updates! (Geostationary)
    goes_east_geocolor: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-East_ABI_GeoColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        matrix: "GoogleMapsCompatible_Level7",
        layer: "GOES-East_ABI_GeoColor",
        name: "GOES-East GeoColor (10min)",
        format: "image/png",
        maxLevel: 9,
        description: "10-minute updates! Americas & Atlantic view",
        temporal: "10min",
    },
    goes_west_geocolor: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GOES-West_ABI_GeoColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "GOES-West_ABI_GeoColor",
        name: "GOES-West GeoColor (10min)",
        matrix: "GoogleMapsCompatible_Level7",
        maxLevel: 9,
        format: "image/png",
        description: "10-minute updates! Pacific & Americas view",
        temporal: "10min",
    },
    // True Color - Most popular, near real-time
    modis_terra: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
        layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
        name: "MODIS Terra True Color",
        matrix: "GoogleMapsCompatible_Level9",
        maxLevel: 9,
        format: "image/jpeg",
        description: "Daily true color imagery (updated within 3 hours)",
        temporal: "daily",
    },
    modis_aqua: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
        layer: "MODIS_Aqua_CorrectedReflectance_TrueColor",
        name: "MODIS Aqua True Color",
        matrix: "GoogleMapsCompatible_Level9",
        maxLevel: 9,
        format: "image/jpeg",
        description: "Daily true color imagery from Aqua satellite",
        temporal: "daily",
    },
    viirs_snpp: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg",
        layer: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
        name: "VIIRS True Color (High Res)",
        matrix: "GoogleMapsCompatible_Level9",
        maxLevel: 9,
        format: "image/jpeg",
        description: "High resolution daily imagery (375m resolution)",
        temporal: "daily",
    },
    // Snow and Ice
    snow_cover: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_L3_Snow_Extent_8Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "MODIS_Terra_L3_Snow_Extent_8Day",
        name: "Snow Cover (8-Day)",
        matrix: "GoogleMapsCompatible_Level8",
        maxLevel: 8,
        format: "image/png",
        description: "8-day composite snow extent",
        temporal: "daily",
    },
    // Temperature
    land_temp_day: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "MODIS_Terra_Land_Surface_Temp_Day",
        name: "Land Surface Temperature (Day)",
        matrix: "GoogleMapsCompatible_Level7",
        maxLevel: 7,
        format: "image/png",
        description: "Daily land surface temperature",
        temporal: "daily",
    },
    // Fires and Thermal Anomalies
    fires: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Thermal_Anomalies_All/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "MODIS_Terra_Thermal_Anomalies_All",
        name: "Active Fires",
        matrix: "GoogleMapsCompatible_Level9",
        maxLevel: 9,
        format: "image/png",
        description: "Active fire detections",
        temporal: "daily",
    },
    // Clouds
    cloud_fraction: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Cloud_Fraction_Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "MODIS_Terra_Cloud_Fraction_Day",
        name: "Cloud Fraction",
        matrix: "GoogleMapsCompatible_Level6",
        maxLevel: 6,
        format: "image/png",
        description: "Daily cloud coverage",
        temporal: "daily",
    },
    // Vegetation
    ndvi: {
        url: "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.png",
        layer: "MODIS_Terra_NDVI_8Day",
        name: "Vegetation Index (NDVI)",
        matrix: "GoogleMapsCompatible_Level7",
        maxLevel: 7,
        format: "image/png",
        description: "8-day vegetation health index",
        temporal: "daily",
    },
};
export default function ViewPage() {
    const cesiumContainer = useRef<HTMLDivElement | null>(null);
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [activeLayer, setActiveLayer] = useState<any>(null);
    const [currentDate, setCurrentDate] = useState(() => {
        // Default to yesterday (data usually available with 1 day delay)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 2);
        return yesterday.toISOString().split('T')[0];
    });
    const [currentTime, setCurrentTime] = useState("12:00");
    const [selectedLayerKey, setSelectedLayerKey] = useState<string>("goes_east_geocolor");
    const [resolution, setResolution] = useState<string>("medium");

    const [selectedPlanet, setSelectedPlanet] = useState<string>("earth");


// Add this ref to track cleanup
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!cesiumContainer.current) return;
        let v: Viewer;
       //Cesium.Ion.defaultAccessToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiNWRkNjFmOS1hNDA4LTQ2ZDgtODhmZC0wZTRmNDViNGRjYmYiLCJpZCI6MzQ1NzgyLCJpYXQiOjE3NTkxOTk4MDh9.wuaf6813XPF4-iLFbKIXGHey4mTKpC5E0cnrGYMY7YU")


        if (selectedPlanet === "earth") {
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,
            });
            viewerRef.current = v;
            v.scene.globe.enableLighting = true;
            v.camera.setView({
                destination: Cartesian3.fromDegrees(0, 0, 20000000), // Zoomed out to see the whole Earth
                orientation: {
                    heading: 0,
                    pitch: -Math.PI / 2,
                    roll: 0
                }
            });
            v.scene.globe.enableLighting = true;
            v.scene.globe.atmosphereLightIntensity = 0.5;
            v.scene.globe.backFaceCulling = true;
            v.scene.globe.atmosphereBrightnessShift = 0.5;
            v.entities.add({
                name: "GOES-West (GOES-17)",
                position: Cesium.Cartesian3.fromDegrees(
                    -137.2, // longitude (W = negative)
                    0,      // latitude (over equator)
                    35786000 // altitude in meters (~35,786 km)
                ),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.ORANGE,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                },
                label: {
                    text: "GOES-West",
                    font: "14px sans-serif",
                    fillColor: Cesium.Color.WHITE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                }
            })
            v.entities.add({
                name: "GOES-East (GOES-16)",
                position: Cesium.Cartesian3.fromDegrees(
                    -75.2, // longitude (W = negative)
                    0,     // latitude (over equator)
                    35786000 // altitude in meters (~35,786 km)
                ),
                point: {
                    pixelSize: 12,
                    color: Cesium.Color.CYAN,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                },
                label: {
                    text: "GOES-East",
                    font: "14px sans-serif",
                    fillColor: Cesium.Color.WHITE,
                    pixelOffset: new Cesium.Cartesian2(0, -20),
                }
            });
            // Configure clock for better date range
            v.clock.startTime = JulianDate.fromIso8601("2000-01-01T00:00:00Z");
            v.clock.stopTime = JulianDate.fromIso8601(new Date().toISOString());
            v.clock.currentTime = JulianDate.fromIso8601(currentDate + "T" + currentTime + ":00Z");
            v.clock.clockRange = 0; // Unbounded - allows scrubbing through entire range
            v.clock.multiplier = 600; // 10 minutes per second for GOES data



            // Optional: fly the camera to it
            //viewer.flyTo(goesEast);
            setViewer(v);
        } else if (selectedPlanet === "mars") {
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,
            });
            viewerRef.current = v;
            v.scene.globe = new Cesium.Globe(Cesium.Ellipsoid.MARS);
            v.scene.backgroundColor = new Color(0.1, 0, 0.1, 1); // Dark reddish background
            v.scene.globe.enableLighting = false;
            v.camera.setView({
                destination: Cartesian3.fromDegrees(0, 0, 20000000), // Zoomed out to see the whole Earth
                orientation: {
                    heading: 0,
                    pitch: -Math.PI / 2,
                    roll: 0
                }
            });
            // Configure clock for better date range
            v.clock.startTime = JulianDate.fromIso8601("2000-01-01T00:00:00Z");
            v.clock.stopTime = JulianDate.fromIso8601(new Date().toISOString());
            v.clock.currentTime = JulianDate.fromIso8601(currentDate + "T" + currentTime + ":00Z");
            v.clock.clockRange = 0; // Unbounded - allows scrubbing through entire range
            v.clock.multiplier = 600; // 10 minutes per second for GOES data



            // Optional: fly the camera to it
            //viewer.flyTo(goesEast);
            setViewer(v);
        } else if (selectedPlanet === "moon") {
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,
            });
            viewerRef.current = v;
            v.scene.moon = new Cesium.Moon();
            v.scene.moon.textureUrl = 'https://cesium.com/downloads/cesiumjs/releases/1.104/Build/Cesium/Assets/Textures/Moon.jpg';
            v.scene.backgroundColor = new Color(0.05, 0.05, 0.1, 1); // Dark bluish background
            v.scene.globe.enableLighting = false;
            v.camera.setView({
                destination: Cartesian3.fromDegrees(0, 0, 20000000), // Zoomed out to see the whole Earth
                orientation: {
                    heading: 0,
                    pitch: -Math.PI / 2,
                    roll: 0
                }
            });
            // Configure clock for better date range
            v.clock.startTime = JulianDate.fromIso8601("2000-01-01T00:00:00Z");
            v.clock.stopTime = JulianDate.fromIso8601(new Date().toISOString());
            v.clock.currentTime = JulianDate.fromIso8601(currentDate + "T" + currentTime + ":00Z");
            v.clock.clockRange = 0; // Unbounded - allows scrubbing through entire range
            v.clock.multiplier = 600; // 10 minutes per second for GOES data



            // Optional: fly the camera to it
            //viewer.flyTo(goesEast);
            setViewer(v);
        }



        return () => {
            viewerRef.current = null;
            v.destroy();
        };
    }, [selectedPlanet]);

    // Add or update layer when date or layer type changes
    useEffect(() => {
        if (!viewer) return;

        // Remove existing layer if present
        if (activeLayer) {
            viewer.imageryLayers.remove(activeLayer);
        }

        const layerConfig = GIBS_LAYERS[selectedLayerKey as keyof typeof GIBS_LAYERS];

        // For 10-minute data, format time as YYYY-MM-DDTHH:MM:SSZ
        // For daily data, format as YYYY-MM-DD
        let timeString;
        if (layerConfig.temporal === "10min") {
            timeString = `${currentDate}T${currentTime}:00Z`;
            //snap time to 10 minute increments to avoid missing api call on 10 minute imagry
            const dateObj = new Date(`${currentDate}T${currentTime}:00Z`);
            const minutes = Math.floor(dateObj.getUTCMinutes() / 10) * 10;
            const rounded = new Date(dateObj);
            rounded.setUTCMinutes(minutes, 0, 0);
            timeString = rounded.toISOString().split(".")[0] + "Z";
            // → e.g. "2025-09-30T12:10:00Z"
        } else {
            timeString = currentDate;
        }


        const url = layerConfig.url.replace("{Time}", timeString);
        let provider;
        if(selectedPlanet === "earth") {
            provider = new WebMapTileServiceImageryProvider({
                url: url,
                layer: layerConfig.layer,
                style: "default",
                tileMatrixSetID: layerConfig.matrix,
                format: layerConfig.format,
                credit: new Credit("NASA GIBS"),
                maximumLevel: 6 // ← clamp here
            });
        }else if(selectedPlanet === "moon"){
            provider = new WebMapTileServiceImageryProvider({
                url: `https://wms.lroc.asu.edu/lroc/view?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${selectedLayerKey}&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=image/jpeg`,
                layer: selectedLayerKey,
                style: "default",
                tileMatrixSetID: "GoogleMapsCompatible",
                format: "image/jpeg",
                credit: new Credit("LRO WAC - NASA/GSFC/Arizona State University"),
                maximumLevel: 7 // ← clamp here

            })
        }else{
            // Mars - currently no temporal layers available, so just load a static high-res basemap
            provider = new WebMapTileServiceImageryProvider({
                url: `https://wms.lroc.asu.edu/lroc/view?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${selectedLayerKey}&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=image/jpeg`,
                layer: selectedLayerKey,
                style: "default",
                tileMatrixSetID: "GoogleMapsCompatible",
                format: "image/jpeg",
                credit: new Credit("LRO WAC - NASA/GSFC/Arizona State University"),
                maximumLevel: 7 // ← clamp here
            });
        }

        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.alpha = 0.8;
        setActiveLayer(layer);

        // Update clock
        viewer.clock.currentTime = JulianDate.fromIso8601(timeString);
    }, [viewer, currentDate, selectedLayerKey]);

    // Listen to Cesium clock changes and update layer accordingly
    useEffect(() => {
        if (!viewer) return;

        const clockListener = viewer.clock.onTick.addEventListener((clock) => {
            const julianDate = clock.currentTime;
            const date = JulianDate.toDate(julianDate);
            const dateString = date.toISOString().split('T')[0];
            //const timeString = date.toISOString().split('T')[1].substring(0, 5); // HH:MM

            const layerConfig = GIBS_LAYERS[selectedLayerKey as keyof typeof GIBS_LAYERS];

            if (layerConfig.temporal === "10min") {
                // For 10-minute data, round to nearest 10 minutes
                const minutes = Math.floor(date.getMinutes() / 10) * 10;
                const roundedTime = `${String(date.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                if (dateString !== currentDate || roundedTime !== currentTime) {
                    setCurrentDate(dateString);
                    setCurrentTime(roundedTime);
                }
            } else {
                // For daily data, only update if date changed
                if (dateString !== currentDate) {
                    setCurrentDate(dateString);
                }
            }
        });

        return () => {
            // Only cleanup if viewer still exists
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                try {
                    viewerRef.current.clock.onTick.removeEventListener(clockListener);
                } catch (e) {
                    console.log("Clock listener already cleaned up");
                }
            }
        };

    }, [viewer, currentDate, currentTime, selectedLayerKey]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentDate(e.target.value);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentTime(e.target.value);
    };

    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLayerKey(e.target.value);
    };

    const toggleLayer = () => {
        if (activeLayer) {
            activeLayer.show = !activeLayer.show;
            setActiveLayer({...activeLayer});
        }
    };

    const HandleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        //resChangedRef.current = true;
        setResolution(e.target.value);
    }

    const goToNow = () => {
        const now = new Date();
        setCurrentDate(now.toISOString().split('T')[0]);
        const minutes = Math.floor(now.getMinutes() / 10) * 10;
        setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    };

    const currentLayerInfo = GIBS_LAYERS[selectedLayerKey as keyof typeof GIBS_LAYERS];
    const isTemporalLayer = currentLayerInfo.temporal === "10min";

    const handlePlanetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const planet = e.target.value;
        setSelectedPlanet(planet);
    }
    return (
        <>
            <div className="relative w-full h-screen bg-black">
                <div ref={cesiumContainer} className="w-full h-full" />

                <div className="absolute top-4 left-4 bg-black/90 text-white p-4 rounded-lg space-y-3 max-w-sm shadow-xl border border-gray-700">
                    <h3 className="font-bold text-xl text-blue-400">NASA GIBS Earth Viewer</h3>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium mb-1">
                            Planet:
                        </label>
                        <select
                            value={selectedPlanet}
                            onChange={handlePlanetChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                                <option value="earth" label="earth" />
                                <option value="mars" label="mars" />
                                <option value="moon" label="moon" />
                        </select>
                        {selectedPlanet === "earth" ? (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Imagery Layer:
                            </label>
                            <select
                                value={selectedLayerKey}
                                onChange={handleLayerChange}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                            >
                                <optgroup label="🔴 LIVE - 10 Minute Updates">
                                    <option value="goes_east_geocolor">GOES-East (Americas)</option>
                                    <option value="goes_west_geocolor">GOES-West (Pacific)</option>
                                </optgroup>
                                <optgroup label="True Color Imagery">
                                    <option value="modis_terra">MODIS Terra (Daily)</option>
                                    <option value="modis_aqua">MODIS Aqua (Daily)</option>
                                    <option value="viirs_snpp">VIIRS High Resolution (Daily)</option>
                                </optgroup>
                                <optgroup label="Snow & Ice">
                                    <option value="snow_cover">Snow Cover</option>
                                </optgroup>
                                <optgroup label="Temperature">
                                    <option value="land_temp_day">Land Temperature</option>
                                </optgroup>
                                <optgroup label="Fires & Hazards">
                                    <option value="fires">Active Fires</option>
                                </optgroup>
                                <optgroup label="Weather">
                                    <option value="cloud_fraction">Cloud Coverage</option>
                                </optgroup>
                                <optgroup label="Vegetation">
                                    <option value="ndvi">Vegetation Health (NDVI)</option>
                                </optgroup>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                {currentLayerInfo.description}
                            </p>
                        </div>
                            ) : selectedPlanet === "mars" ? (
                            <div>
                                <p>placeholder</p>
                            </div>
                        ) : selectedPlanet === "moon" ? (
                            <>
                                <label className="block text-sm font-medium mb-1">
                                    Imagery Layer:
                                </label>
                            <select
                                value={selectedLayerKey}
                                onChange={handleLayerChange}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                            >
                                <optgroup label="Static Views - No Time Component">
                                    <option value="lro_wac_global">Global mosaic</option>
                                    <option value="lro_wac_color">Color composite</option>
                                    <option value="lro_lola_elevation">Elevation map</option>
                                </optgroup>
                            </select>
                                </>
                            ) : <></>}

                        <div>
                            <button
                                onClick={goToNow}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            >
                                Jump to Now
                            </button>
                        </div>
                    </div>



                    <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                        💡 Scrub timeline - images preload in background for smooth playback
                    </div>
                    <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                        ⚙️ Resolution:
                        {resolution === "potato" ? "Potato (Fastest)" : resolution === "low" ? " Low (Fast)" : resolution === "medium" ? " Medium (recommended)" : " High (Requires high speed internet)"}
                        <select
                            value={resolution}
                            onChange={HandleResolutionChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option label="Potato" value="potato" />
                            <option label="Low" value="low" />
                            <option label="Medium" value="medium" />
                            <option label="High" value="high" />
                        </select>
                    </div>
                </div>
                {(() => {
                    const now = new Date();
                    const selected = new Date(`${currentDate}T${currentTime}:00Z`);
                    return selected > now && isTemporalLayer;
                })() ? (
                    <div className="absolute bottom-1/2 left-1/2 bg-red-600/90 text-white p-2 rounded-lg text-sm max-w-sm shadow-xl border border-red-700">
                        ⚠️ Note: Future time selected or I failed to get data for this time set - latest available data is from {new Date().toISOString().split('T')[0]} at {new Date().toISOString().split('T')[1].substring(0,5)} UTC
                    </div>
                ) : null}

            </div>
        </>
    );
}

/*
export default function ViewPage() {
    const cesiumContainer = useRef(null);
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [activeLayer, setActiveLayer] = useState(null);
    const [selectedLayerKey, setSelectedLayerKey] = useState("goes_east_geocolor");
    const [currentTimeString, setCurrentTimeString] = useState("");
    const [preloadedCount, setPreloadedCount] = useState(0);

    const lastLayerTimeRef = useRef("");
    const lastUpdateTimeRef = useRef(Date.now() - 1000);
    const preloadCacheRef = useRef(new Map());
    const isJumpingRef = useRef(false);
    const preloadIntervalRef = useRef(null);

    const [resolution, setResolution] = useState<string>("medium");
    const resChangedRef = useRef<boolean>(false);
    const [isChangingLayer, setIsChangingLayer] = useState<boolean>(false);




    useEffect(() => {
        if (!viewer) return;
        if (!activeLayer) return;

        // Clear cache to force new providers with updated resolution
        preloadCacheRef.current.clear();
        console.log('cache ref', preloadCacheRef.current);
        setPreloadedCount(0);
        lastLayerTimeRef.current = "";

        const layerConfig = GIBS_LAYERS[selectedLayerKey];
        const date = JulianDate.toDate(viewer.clock.currentTime);
        const timeString = getFormattedTime(date, layerConfig);

        // Remove current layer
        if (activeLayer) {
            viewer.imageryLayers.remove(activeLayer);
        }

        // Create new provider with updated maxLevel
        updateLayer(timeString);

    }, [resolution]);
    // Background preloader - loads past data continuously
    useEffect(() => {
        if (!viewer || isChangingLayer) return;

        const layerConfig = GIBS_LAYERS[selectedLayerKey];

        let preloadIndex = 1;
        const maxPreload = layerConfig.temporal === "10min" ? 24 : 30;

        const intervalId = setInterval(() => {
            if (preloadIndex >= maxPreload) {
                clearInterval(intervalId);
                return;
            }

            const currentDate = JulianDate.toDate(viewer.clock.currentTime);
            const preloadDate = new Date(currentDate);

            if (layerConfig.temporal === "10min") {
                preloadDate.setMinutes(preloadDate.getMinutes() - (preloadIndex * 10));
            } else {
                preloadDate.setDate(preloadDate.getDate() - preloadIndex);
            }

            const timeString = getFormattedTime(preloadDate, layerConfig);
            preloadImagery(timeString, layerConfig);

            setPreloadedCount(preloadIndex);
            preloadIndex++;
        }, 500);

        preloadIntervalRef.current = intervalId;

        return () => {
            clearInterval(intervalId);
            preloadIntervalRef.current = null;
        };
    }, [viewer, selectedLayerKey, isChangingLayer]);

    // Listen to clock and update layer when time changes
    useEffect(() => {
        if (!viewer) return;

        const layerConfig = GIBS_LAYERS[selectedLayerKey];

        layerConfig.maxLevel = resolution === "potato" ? 1 : resolution === "low" ? 3 : resolution === "medium" ? 5 : layerConfig.maxLevel = 9;

        const clockListener = viewer.clock.onTick.addEventListener((clock) => {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

            // Detect if we're jumping (large time change in short period)
            if (timeSinceLastUpdate < 100 && !isJumpingRef.current) {
                isJumpingRef.current = true;
                console.log("🚀 Jump detected - throttling updates");
            } else if (timeSinceLastUpdate > 500) {
                isJumpingRef.current = false;
            }

            const date = JulianDate.toDate(clock.currentTime);
            const timeString = getFormattedTime(date, layerConfig);

            setCurrentTimeString(timeString);

            // If jumping, only update every 300ms to skip intermediate frames
            if (isJumpingRef.current && timeSinceLastUpdate < 300) {
                return;
            }

            // Only update layer if time actually changed
            if (timeString !== lastLayerTimeRef.current && now - lastUpdateTimeRef.current > 500) {
                updateLayer(timeString);
                lastUpdateTimeRef.current = now;
            }

        });

        return () => {
            viewer.clock.onTick.removeEventListener(clockListener);
        };
    }, [viewer, selectedLayerKey, resolution]);


    // Preload imagery provider into cache
   const preloadImagery = (timeString: string, layerConfig) => {
        const cacheKey = `${layerConfig.layer}-${timeString}-${resolution}`;

        if (preloadCacheRef.current.has(cacheKey)) {
            console.log("found cached", cacheKey)
            return preloadCacheRef.current.get(cacheKey);
        }

        //update resolution max level
        layerConfig.maxLevel = resolution === "potato" ? 1 : resolution === "low" ?  3 : resolution === "medium" ?  5 : layerConfig.maxLevel = 9;
        // Create new imagery provider
        const url = layerConfig.url.replace("{Time}", timeString);
        const provider = new WebMapTileServiceImageryProvider({
            url: url,
            layer: layerConfig.layer,
            style: "default",
            tileMatrixSetID: layerConfig.matrix,
            format: layerConfig.format,
            credit: new Credit("NASA GIBS"),
            maximumLevel: layerConfig.maxLevel,
        });

        preloadCacheRef.current.set(cacheKey, provider);
        return provider;
    };

    // Update layer - use cached provider if available
    const updateLayer = (timeString) => {
        if (!viewer || isChangingLayer) return;

        const layerConfig = GIBS_LAYERS[selectedLayerKey];
        const cacheKey = `${layerConfig.layer}-${timeString}-${resolution}`;

        //Remove existing layer
        if (activeLayer && timeString !== lastLayerTimeRef.current) {
            viewer.imageryLayers.remove(activeLayer);
            console.log("✗ Removed previous imagery layer");
        }

        // Use cached provider or create new one
        let provider;
        console.log("Cache size:", preloadCacheRef.current.size);
        console.log("Cache items:", preloadCacheRef.current);

        if (preloadCacheRef.current.has(cacheKey)) {
            provider = preloadCacheRef.current.get(cacheKey);
            console.log("✓ Using cached imagery for:", timeString);
       } else {
            provider = preloadImagery(timeString, layerConfig);
            console.log("⟳ Loading new imagery for:", timeString);
       }

        const layer = viewer.imageryLayers.addImageryProvider(provider);
        layer.alpha = 0.8;
        setActiveLayer(layer);
        lastLayerTimeRef.current = timeString;
    };


    const handleLayerChange = (e) => {
        setIsChangingLayer(true)

        // Clear preload interval
        if (preloadIntervalRef.current) {
            clearInterval(preloadIntervalRef.current);
            preloadIntervalRef.current = null;
        }

        // Clear cache and reset counters
        preloadCacheRef.current.clear();
        setPreloadedCount(0);
        lastLayerTimeRef.current = "";

        setSelectedLayerKey(e.target.value);

        setTimeout(() => {
            preloadCacheRef.current.clear();
        setPreloadedCount(0);
        setIsChangingLayer(false);
        console.log('finished changing layer')
        },7000);
    };

    const goToNow = () => {
        if (viewer) {
            const now = new Date();
            viewer.clock.currentTime = JulianDate.fromDate(now);
        }
    };

    const currentLayerInfo = GIBS_LAYERS[selectedLayerKey];
    const isTemporalLayer = currentLayerInfo.temporal === "10min" || currentLayerInfo.temporal === "daily";

    const HandleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        resChangedRef.current = true;
        setResolution(e.target.value);
        }
    return (
        <div className="relative w-full h-screen bg-black">
            <div ref={cesiumContainer} className="w-full h-full" />

            <div className="absolute top-4 left-4 bg-black/90 text-white p-4 rounded-lg space-y-3 max-w-sm shadow-xl border border-gray-700">
                <h3 className="font-bold text-xl text-blue-400">NASA GIBS Earth Viewer</h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Imagery Layer:
                        </label>
                        <select
                            value={selectedLayerKey}
                            onChange={handleLayerChange}
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                            <optgroup label="🔴 LIVE - 10 Minute Updates">
                                <option value="goes_east_geocolor">GOES-East (Americas)</option>
                                <option value="goes_west_geocolor">GOES-West (Pacific)</option>
                            </optgroup>
                            <optgroup label="True Color Imagery">
                                <option value="modis_terra">MODIS Terra (Daily)</option>
                                <option value="modis_aqua">MODIS Aqua (Daily)</option>
                                <option value="viirs_snpp">VIIRS High Resolution (Daily)</option>
                            </optgroup>
                            <optgroup label="Snow & Ice">
                                <option value="snow_cover">Snow Cover</option>
                            </optgroup>
                            <optgroup label="Temperature">
                                <option value="land_temp_day">Land Temperature</option>
                            </optgroup>
                            <optgroup label="Fires & Hazards">
                                <option value="fires">Active Fires</option>
                            </optgroup>
                            <optgroup label="Weather">
                                <option value="cloud_fraction">Cloud Coverage</option>
                            </optgroup>
                            <optgroup label="Vegetation">
                                <option value="ndvi">Vegetation Health (NDVI)</option>
                            </optgroup>
                        </select>
                        <p className="text-xs text-gray-400 mt-1">
                            {currentLayerInfo.description}
                        </p>
                    </div>

                    <div>
                        <button
                            onClick={goToNow}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                            Jump to Now
                        </button>
                    </div>
                </div>


                <div className="pt-2 border-t border-gray-700 text-xs space-y-1">
                    <p className="text-gray-400">Data: NASA GIBS</p>
                    {isTemporalLayer ? (
                        <p className="text-green-400 font-medium">⚡ Live: Updates every 10 minutes</p>
                    ) : (
                        <p className="text-gray-400">Updated within 3 hours of observation</p>
                    )}
                    {currentTimeString && (
                        <p className="text-blue-300 font-mono text-[10px]">
                            Current: {currentTimeString}
                        </p>
                    )}
                    {preloadedCount > 0 && (
                        <p className="text-purple-400 text-[10px]">
                            📦 Preloaded: {preloadedCount} {isTemporalLayer ? "frames" : "days"}
                        </p>
                    )}
                </div>

                <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                    💡 Scrub timeline - images preload in background for smooth playback
                </div>
                <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                    ⚙️ Resolution:
                    {resolution === "potato" ? "Potato (Fastest)" : resolution === "low" ? " Low (Fast)" : resolution === "medium" ? " Medium (recommended)" : " High (Requires high speed internet)"}
                    <select
                        value={resolution}
                        onChange={HandleResolutionChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"
                        >
                        <option label="Potato" value="potato" />
                        <option label="Low" value="low" />
                        <option label="Medium" value="medium" />
                        <option label="High" value="high" />
                    </select>
                </div>
            </div>
        </div>
    );
}
*/