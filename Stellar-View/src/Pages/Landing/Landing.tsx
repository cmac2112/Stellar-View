import Layout from "../../Components/Layout.tsx";
import Button from "../../Components/Button.tsx";
import video from "../../assets/stellar2.mp4";
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
                className={`text-7xl font-extrabold bg-gradient-to-tl from-teal-500 via-purple-500 to-red-500 text-transparent bg-clip-text py-4 transition-opacity duration-1500 ${showHeading ? "opacity-100" : "opacity-0"}`}
            >
                Embiggen Your Eyes With Stellar View
            </h2>
            <div className={`transition-opacity duration-1500 ${showHeading ? "opacity-100" : "opacity-0"}`}>
                {/* Place Button components here */}
                <div className={`transition-opacity flex gap-10 duration-1500 ${showHeading ? "opacity-100" : "opacity-0"}`}>
                    <Button materialIconName="Explore" label="Explore Live Sattelite Views" OnClickCallback={() => navigate("/planet-view")} />
                    <Button materialIconName="Explore" label="Explore NASA Image Sets" OnClickCallback={() => navigate("/image-view")} />
                </div>
            </div>
            <div id="hero-video-container">
                <video src={video} autoPlay loop muted className="max-w-full h-auto rounded-lg shadow-lg opacity-90 p-60" />
                {/* Replace with actual image or SVG or gif of use */}
            </div>
        </div>
        </Layout>
    )
}