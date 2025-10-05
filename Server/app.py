from flask import Flask, send_file, request, jsonify, send_from_directory
from PIL import Image
import io
import requests
from flask_cors import CORS
from collections import OrderedDict
import hashlib

app = Flask(__name__, static_folder="../Stellar-View/dist", static_url_path="/")

@app.route('/')
def serve_dist():
    return send_from_directory(app.static_folder, "index.html")
CORS(app)

# LRU Cache for converted images (max 10 images)
image_cache = OrderedDict()
MAX_CACHE_SIZE = 10

def get_cache_key(url):
    """Generate a unique cache key from URL"""
    return hashlib.md5(url.encode()).hexdigest()

@app.route('/convert-tiff')
def convert_tiff():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400

    cache_key = get_cache_key(url)

    # Check if image is in cache
    if cache_key in image_cache:
        print(f"Cache hit for {url}")
        # Move to end (mark as recently used)
        image_cache.move_to_end(cache_key)
        return send_file(io.BytesIO(image_cache[cache_key]), mimetype='image/png')

    try:
        print(f"Cache miss, fetching {url}")
        # Fetch TIFF from NASA
        response = requests.get(url, stream=True)
        response.raise_for_status()

        # Open with Pillow and convert to PNG
        img = Image.open(io.BytesIO(response.content))

        # Convert to PNG in memory (lossless)
        png_io = io.BytesIO()
        img.save(png_io, format='PNG', compress_level=1)
        png_data = png_io.getvalue()

        # Add to cache
        image_cache[cache_key] = png_data
        image_cache.move_to_end(cache_key)

        # Remove oldest if cache exceeds limit
        if len(image_cache) > MAX_CACHE_SIZE:
            oldest_key = next(iter(image_cache))
            print(f"Cache full, removing {oldest_key}")
            image_cache.pop(oldest_key)

        return send_file(io.BytesIO(png_data), mimetype='image/png')

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/cache-stats')
def cache_stats():
    """Endpoint to check cache status"""
    return jsonify({
        'cached_images': len(image_cache),
        'max_cache_size': MAX_CACHE_SIZE,
        'cache_keys': list(image_cache.keys())
    })

if __name__ == '__main__':
    app.run(debug=True)
