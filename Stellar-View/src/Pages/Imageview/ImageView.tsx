import { useEffect, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";
import Layout from "../../Components/Layout";
//maybe download all the images i need and serve them myself through flask

export default function ImageView() {
    const viewerRef = useRef(null);
    //const [urlentry, setUrlEntry] = useState("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/galaxies/andromeda/Hubble_M31Mosaic_2025_42208x9870_STScI-01JGY8MZB6RAYKZ1V4CHGN37Q6.jpg");
    const [urlentry, setUrlEntry] = useState("https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26276/PIA26276.tif");

    //useEffect(() => {
       // if (!viewerRef.current) return;
/*
        const viewer = OpenSeadragon({
            element: viewerRef.current,
            prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
            tileSources: {
                type: "image",
                url: urlentry,
            },
            showNavigator: true,
            showRotationControl: true,
            zoomPerScroll: 1.2,
            minZoomLevel: 1,
            maxZoomLevel: 10,
        });


        const url = "http://localhost:5000/proxy?url=" + encodeURIComponent("https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005319/frames/3840x2160_16x9_30p/tiff/");
        const checkTiffSupport = async () => {
            const img = new Image();
            return new Promise((resolve) => {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = 'data:image/tiff;base64,SUkqAA=='; // Minimal TIFF
            });
        };
        checkTiffSupport().then((isSupported) => {
            if (!isSupported) {
                alert("TIFF images are not supported in this browser. Please use a different browser.");
            }
        });

// If supported, use directly
        const viewer = OpenSeadragon({
            element: viewerRef.current,
            prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
            tileSources: {
                type: "image",
                url: url, // Direct TIFF URL
            },
        });

        return () => viewer.destroy();
    }, [urlentry]);
    */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!viewerRef.current) return;

        setLoading(true);
        setError(null);

        // Convert TIFF via Flask backend
        const convertedUrl = `http://localhost:5000/convert-tiff?url=${encodeURIComponent(urlentry)}`;

        const viewer = OpenSeadragon({
            element: viewerRef.current,
            prefixUrl: "https://openseadragon.github.io/openseadragon/images/",
            tileSources: {
                type: "image",
                url: convertedUrl,
            },
            showNavigator: true,
            showRotationControl: true,
            zoomPerScroll: 1.2,
            minZoomLevel: 1,
            maxZoomLevel: 10,
        });

        viewer.addHandler('open', () => setLoading(false));
        viewer.addHandler('open-failed', () => {
            setError('Failed to load image');
            setLoading(false);
        });

        return () => viewer.destroy();
    }, [urlentry]);

    return (
        <Layout>
        <div
            ref={viewerRef}
            style={{
                width: "100%",
                height: "90vh",
                background: "#000",
            }}
        />
        <div className="bg-black bg-opacity-50 p-4 flex justify-center items-center">
            <input
                type="text"
                value={urlentry}
                onChange={(e) => setUrlEntry(e.target.value)}
                placeholder="Enter Image URL"
                className="p-2
                rounded-l-lg border border-gray-300
                 focus:outline-none focus:ring-2
                 focus:ring-purple-600 text-white width-full"
                />
        </div>
        </Layout>
    );
}