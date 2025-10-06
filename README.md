# Project Stellar-View

# up to date code is on production branch, ran into some weird "production only" bugs and did a lot of stupid reverts in my delerious state of no sleep

## Summary
Stellar View brings satellite imagery and tools together to allow for
exploring large datasets provided by our lovely NASA folks.
 - Explore the earth and its systems: Stellar View hits satellite API endpoints to bring
in near real time views of the Earth. Datasets include GOES-East GOES-West,
MODIS-Terra, MODIS-Aqua, VIIRS, and much more. Scrub through time to watch hurricanes rage in the
Atlantic! GOES satellites are up to date in 10 minute intervals while all others are every 3 hours or daily all
provided in a friendly user interface with different settings to make the experience 
more enjoyable than current publicly available tools. Stellar view makes it
possible to see where these satellites are in orbit as well. 
 - Explore other heavenly bodies: Stellar view doesn't just stop at Earth. Explore Daily updates to Mars and the Moon through the Lunar Reconnaissance Orbiter 
and the Mars Reconnaissance Orbiter
 - Explore large image sets right in your browser: Stellar View allows for zooming, panning, and labelling of large images in ways like no other app! View Hubble's 2.5 Gigapixel stitched image in clear view only in Stellar View! The options are limitless with the ability for you to enter your own image url's as well to zoom and explore
Project Details
Stellar view makes accessing difficult and interestingly documented data easy in ways other public apps do not!

Use of Artificial Intelligence (AI)
AI was used to correct simple syntax errors across components of the app. Specifically Claude Sonnet 4.5 which has proved itself as the leader of free LLM Model of software development
## Links and Resources
- <a href="https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml">Gibs Satellite capabilities XML of nightmares. Got the job done but melted my brain to look at.
Any satellite data in here can be easily implemented into the app</a>
- <a href="https://svs.gsfc.nasa.gov/gallery/the-galleries/">NASA SVS Gallery of awesome imagery Choose your own .tif to view in the browser with stunning quality</a>
  (best way get .tif download links is to copy the link address of the image you want to view MUST BE .TIF FORMAT)
- <a href="https://cesium.com/platform/cesiumjs/">CesiumJS 3D Globe and Map Engine</a>
- <a href="https://openseadragon.github.io/">OpenSeaDragon - used for viewing large image sets seamlessly</a>

BIG image Viewing

Stellar view utilizes OpenSeaDragon and python libraries to allow near lossless viewing of .TIF images. Implements LRU caches to keep common large image loads quick, and allows the user to inspect any .TIF image they can get their hands on through the url input option. To my knowledge, Stellar View is one of the only apps that allows for in browser .TIF viewing.

Design Considerations

One of the biggest challenges in dealing with large datasets like this is the sheer amount of data volume that one machine must consume in order to display decent imagery to the screen. Have slow internet and you want to look at some satellite imagery this decade? HAH Good luck, it will be 2055 before one day of images load. Stellar View uses clever caching techniques to load images quicker, and while the user is inspecting some interesting formations on the planet, in the background Stellar View continuously loads new images in attempt to keep time scrubbing smooth on the satellite views. A number of UI elements gives the user control over their quality of picture to either increase/decrease quality according to one's internet connection speed

# App Images

<img width="2257" height="1202" alt="image" src="https://github.com/user-attachments/assets/83bf20e9-191f-4159-b91a-c3df22e5e788" />

<img width="2548" height="1178" alt="image" src="https://github.com/user-attachments/assets/2bc19868-6ad2-46c5-b9cd-09d0fe609943" />

<img width="2538" height="1254" alt="image" src="https://github.com/user-attachments/assets/a36adf65-ddbb-42c8-8553-fbc3505935d0" />
