import { useEffect, useRef, useState } from "react";
import {
    Viewer,
    WebMapTileServiceImageryProvider,
    Credit,
    JulianDate,
    Cartesian3,
    Color
} from "cesium";
import * as Cesium from "cesium";
import Layout from "../Components/Layout.tsx"


export type GIBSLayerConfig = {
    url: string;
    matrix: string;
    layer: string;
    name: string;
    format: string;
    maxLevel: number;
    description: string;
    temporal: "10min" | "daily" | "none";
};

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
export default function ViewPage() { //fix typings
    const cesiumContainer = useRef<HTMLDivElement | null>(null);
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [activeLayer, setActiveLayer] = useState<Cesium.ImageryLayer | null>(null);
    const [currentDate, setCurrentDate] = useState(() => {
        // Default to yesterday (data usually available with 1 day delay)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 3);
        return yesterday.toISOString().split('T')[0];
    });
    const [currentTime, setCurrentTime] = useState("12:00");
    const [selectedLayerKey, setSelectedLayerKey] = useState<string>("viirs_snpp");
    const [resolution, setResolution] = useState<string>("medium");

    const [selectedPlanet, setSelectedPlanet] = useState<string>("earth");
    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!cesiumContainer.current) return;
        let v: Viewer;




        if (selectedPlanet === "earth") {
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,

            });
            (async () => {
                const provider = await Cesium.createWorldImageryAsync();
                v.imageryLayers.addImageryProvider(provider);

                viewerRef.current = v;
                v.camera.setView({
                    destination: Cartesian3.fromDegrees(0, 0, 20000000), // Zoomed out to see the whole Earth
                    orientation: {
                        heading: 0,
                        pitch: -Math.PI / 2,
                        roll: 0
                    }
                });

                v.scene.globe.backFaceCulling = true;
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

                // Add animated satellites
                const createModisSatellite = (name: string, color: Cesium.Color, phaseOffset: number) => {
                    return v.entities.add({
                        name: name,
                        position: new Cesium.CallbackProperty(() => {
                            const time = v.clock.currentTime;
                            const date = Cesium.JulianDate.toDate(time);

                            // Orbital period: 98.8 minutes
                            const orbitalPeriodMinutes = 98.8;
                            const minutesSinceEpoch = (date.getTime() / 60000) + phaseOffset;
                            const orbitalAngle = (minutesSinceEpoch / orbitalPeriodMinutes) * 2 * Math.PI;

                            // Earth rotation - satellites drift westward due to sun-synchronous orbit
                            const earthRotationRate = (2 * Math.PI) / (24 * 60); // radians per minute
                            const earthRotation = minutesSinceEpoch * earthRotationRate;

                            const altitude = 705000;
                            const earthRadius = 6371000;
                            const inclination = Cesium.Math.toRadians(98.2);
                            const radius = earthRadius + altitude;

                            // Position in orbital plane
                            const xOrbit = radius * Math.cos(orbitalAngle);
                            const yOrbit = radius * Math.sin(orbitalAngle);

                            // Rotate for inclination
                            const x = xOrbit;
                            const y = yOrbit * Math.cos(inclination);
                            const z = yOrbit * Math.sin(inclination);

                            // Apply Earth rotation (rotate around Z-axis)
                            const xFinal = x * Math.cos(-earthRotation) - y * Math.sin(-earthRotation);
                            const yFinal = x * Math.sin(-earthRotation) + y * Math.cos(-earthRotation);
                            const zFinal = z;

                            return new Cesium.Cartesian3(xFinal, yFinal, zFinal);
                        }, false) as unknown as Cesium.PositionProperty,
                        point: {
                            pixelSize: 10,
                            color: color,
                            outlineColor: Cesium.Color.WHITE,
                            outlineWidth: 2,
                        },
                        label: {
                            text: `${name}\n(EOS ${name === "MODIS Terra" ? "AM-1" : "PM-1"})`,
                            font: "12px sans-serif",
                            fillColor: Cesium.Color.WHITE,
                            pixelOffset: new Cesium.Cartesian2(0, -20),
                            showBackground: true,
                            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                        }
                    });
                };

                createModisSatellite("MODIS Terra", Cesium.Color.CYAN, 0);

                createModisSatellite("MODIS Aqua", Cesium.Color.LIGHTBLUE, 180);
                // Configure clock f        te range
                v.clock.startTime = JulianDate.fromIso8601("2000-01-01T00:00:00Z");
                v.clock.stopTime = JulianDate.fromIso8601(new Date().toISOString());
                v.clock.currentTime = JulianDate.fromIso8601(currentDate + "T" + currentTime + ":00Z");
                v.clock.clockRange = 0;
                v.clock.multiplier = 600;


                setViewer(v);
            })();
            viewerRef.current = v;
        } else if (selectedPlanet === "mars") {
            //3644333
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,
                homeButton: false,
                geocoder: false,
                sceneModePicker: false,
                navigationHelpButton: true, // Show navigation help
            });
            viewerRef.current = v;

            v.scene.globe.show = false;
            if(v.scene.skyAtmosphere != undefined) {
                v.scene.skyAtmosphere.show = false;
            }

            // Store viewer reference for async closure
            const marsViewer = v;

            (async () => {
                try {
                    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_ION_KEY;
                    const moonTileset = await Cesium.Cesium3DTileset.fromIonAssetId(3644333);

                    v.scene.primitives.add(moonTileset);

                    marsViewer.scene.light = new Cesium.DirectionalLight({
                        direction: new Cesium.Cartesian3(1, 0, 0)
                    });


                    const addMRO = () => {
                        // MRO orbital parameters (approximate)
                        const marsRadius = 3389500; // meters
                        const altitude = 300000; // meters above Mars surface
                        const inclination = Cesium.Math.toRadians(93); // near-polar orbit
                        const orbitalPeriodMinutes = 112; // ~2 hours

                        marsViewer.entities.add({
                            name: "Mars Reconnaissance Orbiter (MRO)",
                            position: new Cesium.CallbackProperty(() => {
                                const time = marsViewer.clock.currentTime;
                                const date = Cesium.JulianDate.toDate(time);
                                const minutesSinceEpoch = (date.getTime() / 60000);
                                const orbitalAngle = (minutesSinceEpoch / orbitalPeriodMinutes) * 2 * Math.PI;

                                const radius = marsRadius + altitude;
                                const xOrbit = radius * Math.cos(orbitalAngle);
                                const yOrbit = radius * Math.sin(orbitalAngle);

                                // Rotate for inclination (near-polar orbit)
                                const x = xOrbit;
                                const y = yOrbit * Math.cos(inclination);
                                const z = yOrbit * Math.sin(inclination);

                                return new Cesium.Cartesian3(x, y, z);
                            }, false) as unknown as Cesium.PositionProperty,
                            point: {
                                pixelSize: 10,
                                color: Cesium.Color.RED,
                                outlineColor: Cesium.Color.WHITE,
                                outlineWidth: 2,
                            },
                            label: {
                                text: "MRO",
                                font: "12px sans-serif",
                                fillColor: Cesium.Color.WHITE,
                                pixelOffset: new Cesium.Cartesian2(0, -20),
                                showBackground: true,
                                backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                            }
                        });
                    };

// Call addMRO() after the Mars tileset is loaded
                    addMRO();

                    // Fly to the tileset once loaded
                    await marsViewer.flyTo(moonTileset, {
                        offset: new Cesium.HeadingPitchRange(
                            0,                    // heading
                            Cesium.Math.toRadians(-30), // pitch (look down 30°)
                            moonTileset.boundingSphere.radius * 2.5 // distance (2.5x radius)
                        ),
                        duration: 2
                    });

                } catch (error) {
                    console.error('Failed to load Moon 3D tileset:', error);
                }
            })();
            v.scene.screenSpaceCameraController.enableRotate = true;
            v.scene.screenSpaceCameraController.enableZoom = true;
            v.scene.screenSpaceCameraController.enableTilt = true;
            v.scene.screenSpaceCameraController.enableLook = true;

            v.scene.screenSpaceCameraController.minimumZoomDistance = 0;
            v.scene.screenSpaceCameraController.maximumZoomDistance = 10000000;

            v.scene.backgroundColor = new Color(0.05, 0.05, 0.1, 1);
            v.camera.setView({
                destination: Cartesian3.fromDegrees(0, 0, 50000),
                orientation: {
                    heading: 0,
                    pitch: -Math.PI / 2,
                    roll: 0
                }
            });
            setViewer(v);
        } else if (selectedPlanet === "moon") {
            v = new Viewer(cesiumContainer.current, {
                baseLayerPicker: false,
                timeline: true,
                animation: true,
                homeButton: false,
                geocoder: false,
                sceneModePicker: false,
                navigationHelpButton: true, // Show navigation help
            });
            viewerRef.current = v;

            v.scene.globe.show = false;
            if(v.scene.skyAtmosphere != undefined) {
                v.scene.skyAtmosphere.show = false;
            }

            // Store viewer reference for async closure
            const moonViewer = v;

            (async () => {
                try {
                    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_ION_KEY;
                    const moonTileset = await Cesium.Cesium3DTileset.fromIonAssetId(2684829);

                    v.scene.primitives.add(moonTileset);

                    moonViewer.scene.light = new Cesium.DirectionalLight({
                        direction: new Cesium.Cartesian3(1, 0, 0)
                    });

                    // Fly to the tileset once loaded
                    await moonViewer.flyTo(moonTileset, {
                        offset: new Cesium.HeadingPitchRange(
                            0,                    // heading
                            Cesium.Math.toRadians(-30), // pitch (look down 30°)
                            moonTileset.boundingSphere.radius * 2.5 // distance (2.5x radius)
                        ),
                        duration: 2
                    });

                } catch (error) {
                    console.error('Failed to load Moon 3D tileset:', error);
                }
            })();
            v.scene.screenSpaceCameraController.enableRotate = true;
            v.scene.screenSpaceCameraController.enableZoom = true;
            v.scene.screenSpaceCameraController.enableTilt = true;
            v.scene.screenSpaceCameraController.enableLook = true;

            v.scene.screenSpaceCameraController.minimumZoomDistance = 0;
            v.scene.screenSpaceCameraController.maximumZoomDistance = 10000000;

            v.scene.backgroundColor = new Color(0.05, 0.05, 0.1, 1);
            v.camera.setView({
                destination: Cartesian3.fromDegrees(0, 0, 50000),
                orientation: {
                    heading: 0,
                    pitch: -Math.PI / 2,
                    roll: 0
                }
            });
            const addLRO = () => {
                // LRO orbital parameters (approximate)
                const lunarRadius = 1737400; // meters
                const altitude = 80000; // meters above lunar surface
                const inclination = Cesium.Math.toRadians(90); // polar orbit
                const orbitalPeriodMinutes = 119; // ~2 hours - sped up for demo to 5 minutes

                moonViewer.entities.add({
                    name: "Lunar Reconnaissance Orbiter (LRO)",
                    position: new Cesium.CallbackProperty(() => {
                        const time = moonViewer.clock.currentTime;
                        const date = Cesium.JulianDate.toDate(time);
                        const minutesSinceEpoch = (date.getTime() / 60000);
                        const orbitalAngle = (minutesSinceEpoch / orbitalPeriodMinutes) * 2 * Math.PI;

                        const radius = lunarRadius + altitude;
                        const xOrbit = radius * Math.cos(orbitalAngle);
                        const yOrbit = radius * Math.sin(orbitalAngle);

                        // Rotate for inclination (polar orbit)
                        const x = xOrbit;
                        const y = yOrbit * Math.cos(inclination);
                        const z = yOrbit * Math.sin(inclination);

                        return new Cesium.Cartesian3(x, y, z);
                    }, false) as unknown as Cesium.PositionProperty,
                    point: {
                        pixelSize: 10,
                        color: Cesium.Color.YELLOW,
                        outlineColor: Cesium.Color.WHITE,
                        outlineWidth: 2,
                    },
                    label: {
                        text: "LRO",
                        font: "12px sans-serif",
                        fillColor: Cesium.Color.WHITE,
                        pixelOffset: new Cesium.Cartesian2(0, -20),
                        showBackground: true,
                        backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
                    }
                });
            };

            addLRO();
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

        // TIME API FORMAT HAS TO BE EXACTLY RIGHT OR IT 404s IT MAKES SENSE BUT WHYYYYY even a millisecond off 404s and doesnt tell you what is wrong
        // AT LEAST GIVE US A HINT
        let timeString;
        if (layerConfig.temporal === "10min") {
            timeString = `${currentDate}T${currentTime}:00Z`;
            //snap time to 10 minute increments to avoid missing api call on 10 minute imagry, so dumb
            const dateObj = new Date(`${currentDate}T${currentTime}:00Z`);
            const minutes = Math.floor(dateObj.getUTCMinutes() / 10) * 10;
            const rounded = new Date(dateObj);
            rounded.setUTCMinutes(minutes, 0, 0);
            timeString = rounded.toISOString().split(".")[0] + "Z";

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


            const layer = viewer.imageryLayers.addImageryProvider(provider);
            layer.alpha = 0.8;
            setActiveLayer(layer);
        }
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

            //const layerConfig = GIBS_LAYERS[selectedLayerKey as keyof typeof GIBS_LAYERS];

                if (dateString !== currentDate) {
                    setCurrentDate(dateString);
                }

        });

        return () => {
            // Only cleanup if viewer still exists
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                try {
                    viewerRef.current.clock.onTick.removeEventListener(clockListener);
                } catch (e) {
                    console.log("Clock listener already cleaned up" + e);
                }
            }
        };

    }, [viewer, currentDate, currentTime, selectedLayerKey]);
    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedLayerKey(e.target.value);
    };

    const HandleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
        <Layout title="Daily Imagery: Try the Experiemental version for 10 minute updates here ->">
            <div className="relative w-full h-full bg-black">
                <div ref={cesiumContainer} className="w-full h-full" />

                <div className="absolute top-0 left-4 bg-black/90 text-white p-2 sm:p-2 rounded-lg space-y-3 w-1/3 max-w-xs sm:max-w-sm shadow-xl border border-gray-700">
                    <h3 className="font-bold text-base sm:text-xl text-blue-400">NASA GIBS Earth Viewer</h3>
                    <p>Fullscreen Recommended for PC - Landscape Recommended for Mobile </p>
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
                                    <option value="Cesium-3D-tileset">Global mosaic</option>
                                </optgroup>
                            </select>
                                </>
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
        </Layout>
    );
}
