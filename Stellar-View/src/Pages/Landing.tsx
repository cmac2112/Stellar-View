import Layout from "../Components/Layout.tsx"
import Button from "../Components/Button.tsx";
import video from "../assets/stellar2.mp4";
import { useEffect, useState} from "react";
import { useNavigate } from "react-router-dom";

export default function Landing () {

    const [showHeading, setShowHeading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => setShowHeading(true), 200); // slight delay
        return () => clearTimeout(timer);
    }, []);

    return(
        <Layout>
        <div id="landing-container" className="flex flex-col items-center justify-center min-h-[80vh] gap-4 bg-black">
            <h2
                className={`text-7xl px-2 font-extrabold bg-gradient-to-tl from-teal-500 via-purple-500 to-red-500 text-transparent bg-clip-text py-4 transition-opacity duration-600 ${showHeading ? "opacity-100" : "opacity-0"}`}
            >
                Embiggen Your Eyes With Stellar View
            </h2>
            <div className={`transition-opacity w-1/2 duration-800 ${showHeading ? "opacity-100" : "opacity-0"}`}>
                {/* Place Button components here */}
                <div className={`transition-opacity w-full flex gap-10 duration-1000 flex-col sm:flex-row ${showHeading ? "opacity-100" : "opacity-0"}`}>
                    <Button className='w-full' materialIconName="Explore" label="Explore Live Sattelite Views" OnClickCallback={() => navigate("/planet-view")} />
                    <Button className='w-full' materialIconName="Explore" label="Explore NASA Image Sets" OnClickCallback={() => navigate("/image-view")} />
                </div>
            </div>
            <h2 className={`text-3xl font-extrabold bg-gradient-to-tl from-teal-500 via-purple-500 to-red-500 text-transparent bg-clip-text py-4 transition-opacity duration-1500 ${showHeading ? "opacity-100" : "opacity-0"}`}>About</h2>
            <div className={`w-3/5 duration-1500 ${showHeading ? "opacity-100" : "opacity-0"}`}>
                <p className="text-gray-400">Stellar View brings real time satellite imagery and tools typically found in paid enterprise software for viewing large .TIF images together to allow for exploring large datasets right on the browser.</p>
                <h3 className="text-gray-200 text-3xl py-4 font-extrabold">Explore The Earth And It's Systems</h3>
                <p className="text-gray-400">
                    Stellar View hits NASA's satellite API endpoints to bring in near real time views of the Earth. Datasets
                    include GOES-East GOES-West, MODIS-Terra, MODIS-Aqua, VIIRS, and much more. Scrub through time to watch hurricanes rage in the Atlantic! GOES satellites are up to date in 10 minute intervals while all others are every 3 hours or daily all provided in a friendly user
                    interface with different settings to make the experience more enjoyable than current publicly available tools. Stellar view makes it possible to visualize these satellites in orbit as well.
                </p>
                <h3 className="text-gray-200 text-3xl py-4 font-extrabold">Explore Other Heavenly Bodies</h3>
                <p className="text-gray-400">Stellar view doesn't just stop at Earth. Explore Daily updates to Mars and the Moon through the Lunar Reconnaissance Orbiter and the Mars Reconnaissance Orbiter</p>
                <h3 className="text-gray-200 text-3xl py-4 font-extrabold">Explore Large Image Sets</h3>
                <p className="text-gray-400">Stellar View allows for zooming, panning, and labelling of large images in ways like no other app!
                    View Hubble's 2.5 Gigapixel stitched image in clear view only in Stellar View! The options are limitless with the ability for you to enter your own image url's as well to zoom and explore (under 200MB for user content)</p>
            </div>
            <div id="hero-video-container">
                <video src={video} autoPlay loop muted className="max-w-full h-auto rounded-lg shadow-lg opacity-90 px-80" />
                {/* Replace with actual image or SVG or gif of use */}
            </div>
        </div>
        </Layout>
    )
}