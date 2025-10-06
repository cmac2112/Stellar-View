//import React from 'react';
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import Landing from "./Pages/Landing.tsx"
import './App.css'
import ViewPage from "./Pages/ViewPage.tsx";
import ImageView from "./Pages/ImageView.tsx";
import ExperimentalImageView from "./Pages/ExperimentalView.tsx";
function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing/>} />
                <Route path="/planet-view" element={<ViewPage/>} />
                <Route path="/image-view" element={<ImageView/>} />
                <Route path="/experimental-view" element={<ExperimentalImageView/>} />
            </Routes>
        </Router>
    )
}

export default App
