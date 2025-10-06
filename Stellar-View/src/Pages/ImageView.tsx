import { useEffect, useRef, useState } from "react";
import OpenSeadragon from "openseadragon";
import Layout from "../Components/Layout.tsx"

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
/*
function saveLabels(url: string, labels: Label[]) {
    localStorage.setItem(`labels_${url}`, JSON.stringify(labels));
}
*/

export default function ImageView() {
    const viewerRef = useRef(null);
    const overlayRootRef = useRef<HTMLElement | null>(null);
    const overlaysRef = useRef<Array<{ label: Label; element: HTMLElement }>>([]);
    const [urlentry, setUrlEntry] = useState("https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2025/01/STScI-01JGY8ZEDHYMGM99RF1RQ45YWY.tif/jcr:content/renditions/Reduced%20Res%202.png");

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const osdViewerRef = useRef<any>(null);
    //const [labels, setLabels] = useState<Label[]>([]);


    // Initialize viewer only when URL changes
    useEffect(() => {
        // Create a top-level overlay root at the top of the DOM to ensure overlays sit above the viewer
        if (!overlayRootRef.current) {
            const root = document.createElement('div');
            root.id = 'osd-top-overlay-root';
            // cover the viewport, we'll position children absolutely in page coordinates
            root.style.position = 'absolute';
            root.style.top = '0';
            root.style.left = '0';
            root.style.width = '100%';
            root.style.height = '100%';
            root.style.pointerEvents = 'none';
            root.style.zIndex = '9999';
            document.body.appendChild(root);
            overlayRootRef.current = root;
        }

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
            // Clear any existing overlays (important when switching images)
            try { viewer.clearOverlays(); } catch (e) { /* ignore */ }
            // Draw existing labels
            getLabels(urlentry).forEach(label => {
                drawLabel(viewer, label);
            });
        });

        viewer.addHandler('open-failed', () => {
            setError('Failed to load image');
            setLoading(false);
        });

        // Handle double-click to add label
        viewer.addHandler('canvas-double-click', function(event: any) {
            // Prevent the default zoom on double click
            event.preventDefaultAction = true;

            const webPoint = event.position;
            const viewportPoint = viewer.viewport.pointFromPixel(webPoint);
            const imagePoint = viewer.viewport.viewportToImageCoordinates(viewportPoint);

            const text = window.prompt("Enter label for this point:");
            if (text && text.trim().length > 0) {
                const newLabel: Label = { x: imagePoint.x, y: imagePoint.y, text: text.trim() };
                const existing = getLabels(urlentry);
                const updatedLabels = [...existing, newLabel];
                saveLabels(urlentry, updatedLabels);
                drawLabel(viewer, newLabel);
            }
        });

        // Reposition overlays when the viewer viewport changes
        viewer.addHandler('update-viewport', () => {
            requestAnimationFrame(() => {
                repositionOverlays(viewer);
            })
        });
        return () => {
            viewer.destroy();
            osdViewerRef.current = null;
        };
    }, [urlentry]);


// Draw label marker and text
    function drawLabel(viewer: any, label: Label) {
        //const overlayId = `label_${label.x}_${label.y}_${label.text}`;
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
        // Create container for overlay and let OpenSeadragon manage placement
        const container = document.createElement("div");
        container.style.position = "absolute";
        container.style.pointerEvents = "auto"; // allow interaction
        container.style.zIndex = "10000";
        container.appendChild(marker);
        container.appendChild(textDiv);

        // Append to top-level overlay root so it's above the viewer container
        const root = overlayRootRef.current;
        if (!root) return;
        root.appendChild(container);

        // Track overlay so we can reposition on pan/zoom
        overlaysRef.current.push({ label, element: container });

        // Position immediately
        positionOverlayForLabel(viewer, container, label);
    }

    function positionOverlayForLabel(viewer: any, element: HTMLElement, label: Label) {
        try {
            // Convert image coordinates to viewport coordinates
            const imgPoint = new OpenSeadragon.Point(label.x, label.y);
            const viewportPoint = viewer.viewport.imageToViewportCoordinates(imgPoint);
            // Convert viewport coords to viewer element (pixels) coords
            const viewerPoint = viewer.viewport.viewportToViewerElementCoordinates(viewportPoint);
            const containerRect = (viewer && viewer.container) ? viewer.container.getBoundingClientRect() : { left: 0, top: 0 };

            const pageX = containerRect.left + viewerPoint.x;
            const pageY = containerRect.top + viewerPoint.y;

            element.style.left = `${pageX - element.offsetWidth / 2}px`;
            element.style.top = `${pageY - element.offsetHeight / 2}px`;
        } catch (e) {
            // ignore positioning errors
        }
    }

    function repositionOverlays(viewer: any) {
        const list = overlaysRef.current;
        if (!list || !viewer) return;
        for (const item of list) {
            positionOverlayForLabel(viewer, item.element, item.label);
        }
    }
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
        <div className="bg-gray-950 max-w-full bg-opacity-50 px-4 justify-center items-center pointer-events-auto">
            <div id="url selector">
                <p className="text-white">Select an Image to view .TIFF format right in the browser! No need for special software</p>
                <select
                    onChange={(e) => setUrlEntry(e.target.value)}
                    value={urlentry}
                    className="px-2
                rounded-l-lg border border-gray-300
                 focus:outline-none focus:ring-2
                 focus:ring-purple-600 text-white width-full">
                    <option value="https://assets.science.nasa.gov/content/dam/science/missions/hubble/releases/2025/01/STScI-01JGY8ZEDHYMGM99RF1RQ45YWY.tif/jcr:content/renditions/Reduced%20Res%202.png" className="bg-black text-white">Andromeda Moasic</option>
                    <option value="https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26276/PIA26276.tif" className="bg-black text-white">Andromeda Infrared</option>
                    <option value="https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_2k.tif" className="bg-black text-white">Hi-Res Moon Mosaic</option>
                    <option value="https://esahubble.org/media/archives/images/original/heic0506a.tif" className="bg-black text-white">WhirlPool Galaxy</option>
                    <option value="https://esahubble.org/media/archives/images/original/opo0328a.tif" className="bg-black text-white">Sombrero Galaxy</option>
                    <option value="https://esahubble.org/media/archives/images/original/heic1814a.tif" className="bg-black text-white">Saturn and Mars</option>
                </select>
            </div>
            <div className="flex">
            <div className="flex flex-col w-full">
            <p className="text-white">OR Enter URL For Any NASA .TIF or .PNG image</p>
            <input
                type="text"
                value={urlentry}
                onChange={(e) => setUrlEntry(e.target.value)}
                placeholder="Enter Image URL"
                className="px-2
                rounded-l-lg border border-gray-300
                 focus:outline-none focus:ring-2
                 focus:ring-purple-600 text-white width-full"
                />
            </div>
            <div className="flex flex-col w-full">
                <p className="text-white">Double click to Mark POI's in each image</p>
            </div>
            </div>
        </div>
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

        </Layout>
    );
}