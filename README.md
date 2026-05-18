# 🚀 Stellar View

**Experience Space Like Never Before—Right in Your Browser!**  
🌍🛰️🪐🌕

[Visit the Live App](http://stellarview.us)

---

## 🌟 What is Stellar View?

Stellar View is a modern web application for exploring real-time and historical satellite imagery of Earth and other celestial bodies. Powered by NASA and enterprise-grade visualization tools, it delivers seamless access to massive scientific datasets and mind-blowing, high-res space imagery—no special software required.

---

## ✨ Key Features

- **Real-Time Satellite Explorer:**  
  - Instantly view live and archived imagery from multiple NASA satellites:
    - GOES-East & West (10-min updates!)
    - MODIS Terra & Aqua (daily)
    - VIIRS, Lunar & Mars Orbiters—and more!
  - Scrub through time, spot storms and global events, and visualize orbits in 3D.
  - All through a blazing-fast, interactive UI.

- **Next-Gen Image Viewing:**  
  - Zoom, pan, and annotate gigantic space images (e.g., Hubble’s 2.5 Gigapixel mosaic) directly in your browser.
  - **Unique:** Upload or link any .TIF or .PNG image (up to 300MB) and view it instantly, even if it's from NASA or another open-data provider.
  - Lossless conversion and efficient caching for smooth navigation—even on slow connections.

- **Beyond Earth:**  
  - Updated daily: Browse imagery of the Moon and Mars, leveraging public data from the Lunar and Mars Reconnaissance Orbiters.

- **Supercharged Technology**
  - **Powered by:**  
    - CesiumJS (interactive 3D globes)  
    - OpenSeaDragon (massive image visualization)  
    - Python/Flask back-end for rapid, lossless image conversion & caching  
    - React + TypeScript + Vite + Tailwind for a modern, scalable UI

- **Performance-First Design:**  
  - Custom LRU image caching to minimize wait times (critical for very large files)
  - Client-side controls for quality selection—works even on limited bandwidth

## ⚡️ Why Stellar View Stands Out

- **One of Few**: Enables in-browser, near-lossless .TIF viewing—works with NASA resources the way researchers do.
- **Frictionless Experience:** No need to download or preprocess satellite data.
- **Recruiter Appeal:**  
  - Real-world, public APIs & open science data
  - Full-stack, cloud-ready architecture  
  - Modern UI/UX (animations, gradients, responsive design)
  - Showcases Cesium, OpenSeaDragon, Flask, React, TypeScript, and leading web technologies.
- **AI-Assisted:** Leveraged LLMs to accelerate robust code quality.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, CesiumJS, OpenSeaDragon
- **Backend:** Python Flask (for image proxying, .TIF → PNG conversion, and intelligent LRU caching)
- **Data Sources:**  
  - NASA GIBS, SVS, Worldview APIs, and more.
- **Other:**  
  - Robust build scripts, ESLint config, and a clean, scalable project structure

---

## 🌐 Getting Started

1. **Clone the repo:**  
   ```bash
   git clone https://github.com/cmac2112/Stellar-View.git
   ```

2. **Install dependencies:**  
   ```bash
   cd Stellar-View
   npm install
   ```

3. **Run the Flask server (for TIF support):**  
   ```bash
   cd Server
   pip install -r requirements.txt
   python app.py
   ```

4. **Start the client:**  
   ```bash
   cd ../Stellar-View
   npm run dev
   ```

5. **Browse to:**  
   ```
   http://localhost:5173
   ```
   (Or use the hosted version at [stellarview.us](http://stellarview.us).)

---

## 🛰️ Resources & Data

- [NASA GIBS Satellite Capabilities](https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml)
- [NASA SVS Gallery](https://svs.gsfc.nasa.gov/gallery/the-galleries/) (Find `.tif` images to explore)
- [CesiumJS 3D Globe Engine](https://cesium.com/platform/cesiumjs/)
- [OpenSeaDragon for Big Image Viewing](https://openseadragon.github.io/)

---

## 🏆 Screenshots

<!-- Insert screenshots here if available, showing globe, image viewer, and time scrubbing features. -->

---

## 💡 Design Considerations

- Built to handle enormous datasets fluently, even on slow connections.
- Brings professional-grade visualization to the open web.
- Easily extensible—swap or add new data sources & layers with minimal code.

---

## 🤖 AI Assistance

Used Claude Sonnet 4.5 LLM to accelerate code refactoring, bugfixing, and documentation.

---

## 📫 Contact

Contributor: [cmac2112](https://github.com/cmac2112)  
Feel free to open issues and suggestions!

---

## ⭐ Recruiter Notes

Looking for a candidate with:
- Experience in open data, geospatial visualization, or advanced frontend/backend integration?
- Proof of strong full-stack development, novel UX, and scalable project delivery?
- Proficiency in React, TypeScript, Flask, Python, and big data visualization?

**Stellar View demonstrates all this—in production.**
