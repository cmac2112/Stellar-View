from flask import Flask, send_file, request, jsonify
from PIL import Image
import io
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/convert-tiff')
def convert_tiff():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    try:
        # Fetch TIFF from NASA
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Open with Pillow and convert to PNG
        img = Image.open(io.BytesIO(response.content))

        # Convert to PNG in memory (lossless)
        png_io = io.BytesIO()
        img.save(png_io, format='PNG', compress_level=1)  # compress_level=1 for speed
        png_io.seek(0)
        
        #https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005319/frames/3840x2160_16x9_30p/tiff/moon.0001.tif this one works
        #https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia26/pia26276/PIA26276.tif
        return send_file(png_io, mimetype='image/png')

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
