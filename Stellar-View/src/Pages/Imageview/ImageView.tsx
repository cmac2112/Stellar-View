import { useEffect, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";
import Layout from "../../Components/Layout";
//maybe download all the images i need and serve them myself through flask
type Label = {
    x: number;
    y: number;
    text: string;
};

function getLabels(url: string): Label[] {
    const data = localStorage.getItem(`labels_${url}`);
    return data ? JSON.parse(data) : [];
}

function saveLabels(url: string, labels: Label[]) {
    localStorage.setItem(`labels_${url}`, JSON.stringify(labels));
}
export default function ImageView() {
    const viewerRef = useRef(null);
    //const [urlentry, setUrlEntry] = useState("https://assets.science.nasa.gov/dynamicimage/assets/science/missions/hubble/galaxies/andromeda/Hubble_M31Mosaic_2025_42208x9870_STScI-01JGY8MZB6RAYKZ1V4CHGN37Q6.jpg");
    const [urlentry, setUrlEntry] = useState("https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26276/PIA26276.tif");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const osdViewerRef = useRef<any>(null);
    const [labels, setLabels] = useState<Label[]>([]);


    // Initialize viewer only when URL changes
    useEffect(() => {
        if (!viewerRef.current) return;

        setLoading(true);
        setError(null);

        const convertedUrl = `${import.meta.env.VITE_DOMAIN_LOCAL ?? import.meta.env.VITE_DOMAIN_PROD}/convert-tiff?url=${encodeURIComponent(urlentry)}`;

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

        osdViewerRef.current = viewer;

        viewer.addHandler('open', () => {
            setLoading(false);
            // Draw existing labels
            getLabels(urlentry).forEach(label => {
                drawLabel(viewer, label);
            });
        });

        viewer.addHandler('open-failed', () => {
            setError('Failed to load image');
            setLoading(false);
        });

        // Handle click to add label
        /*
        viewer.addHandler('canvas-click', function(event: any) {
            const webPoint = event.position;
            const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
            const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);

            const text = prompt("Enter label for this point:");
            if (text) {
                const newLabel = { x: imagePoint.x, y: imagePoint.y, text };
                const updatedLabels = [...getLabels(urlentry), newLabel];
                setLabels(updatedLabels);
                saveLabels(urlentry, updatedLabels);
                drawLabel(viewer, newLabel);
            }
        });
*/
        return () => {
            viewer.destroy();
            osdViewerRef.current = null;
        };
    }, [urlentry]);

    // Update overlays when labels change (without reloading image)
    useEffect(() => {
        const viewer = osdViewerRef.current;
        if (!viewer) return;

        // Remove all overlays
        viewer.clearOverlays();

        // Draw all labels
        labels.forEach(label => {
            drawLabel(viewer, label);
        });
    }, [labels]);
// Draw label marker and text
    function drawLabel(viewer: any, label: Label) {
        const overlayId = `label_${label.x}_${label.y}_${label.text}`;
        const marker = document.createElement("div");
        marker.style.position = "absolute";
        marker.style.display = "block";
        marker.style.background = "red";
        marker.style.width = "12px";
        marker.style.height = "12px";
        marker.style.borderRadius = "50%";
        marker.style.zIndex = "1000";
        marker.title = label.text;

        const textDiv = document.createElement("div");
        textDiv.style.position = "absolute";
        textDiv.style.color = "white";
        textDiv.style.background = "rgba(0,0,0,0.7)";
        textDiv.style.padding = "2px 6px";
        textDiv.style.borderRadius = "4px";
        textDiv.style.top = "14px";
        marker.style.zIndex = "1000";
        textDiv.innerText = label.text;
        const canvas = document.getElementsByClassName("openseadragon-canvas")[0];
        if (!canvas) return;
        const container = document.createElement("div");
        container.appendChild(marker);
        container.appendChild(textDiv);

        canvas.appendChild(container);
        viewer.addOverlay({
            element: container,
            location: new OpenSeadragon.Point(label.x, label.y),
            placement: OpenSeadragon.Placement.CENTER
        });
    }
    return (
        <Layout>
            {loading ? (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white p-4 rounded">
                    Loading Image...
                </div>
            ) : null}
            {error ? (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 bg-opacity-75 text-white p-4 rounded">
                    {error}
                </div>
            ) : null}
        <div
            ref={viewerRef}
            style={{
                width: "100%",
                height: "90vh",
                background: "#000",
            }}
        />
        <div className="bg-black bg-opacity-50 p-4 flex justify-center items-center pointer-events-auto">
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