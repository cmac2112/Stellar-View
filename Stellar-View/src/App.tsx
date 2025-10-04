import React, {Suspense} from 'react';
import { BrowserRouter as Router, Routes, Route, } from "react-router-dom";
import Landing from "./Pages/Landing/Landing.tsx";
import './App.css'
import ViewPage from "./Pages/View/ViewPage.tsx";

function App() {

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing/>} />
                <Route path="/view" element={<ViewPage/>} />
            </Routes>
        </Router>
    )
}

export default App
