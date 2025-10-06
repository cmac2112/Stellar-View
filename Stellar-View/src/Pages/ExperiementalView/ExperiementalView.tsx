import { useEffect, useRef, useState } from "react";
import {
    Viewer,
    WebMapTileServiceImageryProvider,
    Credit,
    JulianDate,
    Cartesian3,
} from "cesium";
import {getFormattedTime} from "../View/Helpers.tsx"
import Layout from "../../Components/Layout.tsx";
import * as Cesium from "cesium";

// Define GIBS layers with their configurations
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
}
export default function ExperimentalImageView() {
    const cesiumContainer = useRef(null);
    const [viewer, setViewer] = useState<Viewer | null>(null);
    const [activeLayer, setActiveLayer] = useState<Cesium.ImageryLayer | null>(null);
    const [selectedLayerKey, setSelectedLayerKey] = useState<string>("goes_east_geocolor");
    const [currentTimeString, setCurrentTimeString] = useState<string>("");
    const [preloadedCount, setPreloadedCount] = useState<number>(0);

    const lastLayerTimeRef = useRef("");
    const lastUpdateTimeRef = useRef(Date.now() - 1000);
    const preloadCacheRef = useRef(new Map()); //the classic any type, I know. Will fix later
    const isJumpingRef = useRef<boolean>(false);
    const preloadIntervalRef = useRef<number | null>(null);

    const [resolution, setResolution] = useState<string>("medium");
    const resChangedRef = useRef<boolean>(false);
    const [isChangingLayer, setIsChangingLayer] = useState<boolean>(false);

    const viewerRef = useRef<Viewer | null>(null);

    useEffect(() => {
        if (!cesiumContainer.current) return;
        const v = new Viewer(cesiumContainer.current, {
            baseLayerPicker: false,
            timeline: true,
            animation: true,

        });
        //initially start in the past to allow for preloading in both directions
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        v.clock.currentTime = Cesium.JulianDate.fromDate(twoDaysAgo);
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
            setViewer(v)
        })();
        viewerRef.current = v;
        return () => {
            viewerRef.current = null;
            v.destroy();
        };
    }, []);

    useEffect(() => {
        if (!viewer) return;
        if (!activeLayer) return;

        // Clear cache to force new providers with updated resolution
        preloadCacheRef.current.clear();
        console.log('cache ref', preloadCacheRef.current);
        setPreloadedCount(0);
        lastLayerTimeRef.current = "";

        //it works and im out of time, ignoring the ts error for now
        // @ts-ignore
        const layerConfig= GIBS_LAYERS[selectedLayerKey];
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


        // @ts-ignore
        const layerConfig= GIBS_LAYERS[selectedLayerKey];

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


        // @ts-ignore
        const layerConfig= GIBS_LAYERS[selectedLayerKey];

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
            // Only cleanup if viewer still exists
            if (viewerRef.current && !viewerRef.current.isDestroyed()) {
                try {
                    viewerRef.current.clock.onTick.removeEventListener(clockListener);
                } catch (e) {
                    console.log("Clock listener already cleaned up" + e);
                }
            }
        };
    }, [viewer, selectedLayerKey, resolution]);


    // Preload imagery provider into cache
    const preloadImagery = (timeString: string, layerConfig: GIBSLayerConfig) => {
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
    const updateLayer = (timeString: string) => {
        if (!viewer || isChangingLayer) return;

        // @ts-ignore
        const layerConfig= GIBS_LAYERS[selectedLayerKey];
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


    const handleLayerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    // @ts-ignore
    const currentLayerInfo = GIBS_LAYERS[selectedLayerKey];
    const isTemporalLayer = currentLayerInfo.temporal === "10min" || currentLayerInfo.temporal === "daily";

    const HandleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        resChangedRef.current = true;
        setResolution(e.target.value);
    }
    return (
        <Layout title="Experimental NASA GIBS Viewer - 10 Minute Updates: If you dont see imagery, change the time to earlier in the day. Sometimes imagery is not available yet.">
            <div className="relative w-full h-screen bg-black">
                <div ref={cesiumContainer} className="w-full h-full" />

                <div className="absolute top-0 left-4 bg-black/90 text-white p-2 sm:p-2 rounded-lg space-y-3 w-1/3 max-w-xs sm:max-w-sm shadow-xl border border-gray-700">
                    <h3 className="font-bold text-base sm:text-xl text-blue-400">NASA GIBS Earth Viewer</h3>

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
        </Layout>
    );
}