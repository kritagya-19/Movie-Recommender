from flask import Flask, request, jsonify
from flask_cors import CORS
from model import recommend   # this connects your AI model
import os
import requests
import requests_cache
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()
TMDB_API_KEY = os.getenv('TMDB_API_KEY')
TMDB_BASE = 'https://api.themoviedb.org/3'
IMG_BASE = 'https://image.tmdb.org/t/p'

# 🚀 PERFORMANCE OPTIMIZATION: Cache all TMDB API calls locally for 1 week.
# This prevents duplicate API calls and makes the app instantly fast.
requests_cache.install_cache('tmdb_cache', backend='sqlite', expire_after=604800)

app = Flask(__name__)
CORS(app)

# Cache the local ML model predictions in memory
@lru_cache(maxsize=128)
def cached_recommend(movie):
    return recommend(movie)

# ─── Helper: search TMDB for a title and return the best match ID + media_type ───
def search_tmdb(title):
    """Search TMDB and return (tmdb_id, media_type) for the best match."""
    try:
        resp = requests.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY,
            "query": title,
            "include_adult": False
        })
        results = resp.json().get("results", [])
        # Prefer movie/tv results (skip person results)
        for r in results:
            if r.get("media_type") in ("movie", "tv"):
                return r["id"], r["media_type"]
    except Exception as e:
        print(f"[TMDB search error] {e}")
    return None, None

# ─── Helper: fetch rich details for a single title ───
def fetch_details(title):
    """Return poster, rating, year, overview, backdrop, genres, runtime, cast, and trailer."""
    tmdb_id, media_type = search_tmdb(title)
    
    base_data = {
        "poster": None, "backdrop": None, "rating": None,
        "year": "", "overview": "", "genres": [],
        "runtime": "", "cast": [], "trailer": None,
        "tmdb_id": None, "media_type": None,
        "providers": []
    }
    
    if not tmdb_id:
        return base_data

    try:
        # Fetch main details + credits + videos + watch providers in one call
        detail_resp = requests.get(
            f"{TMDB_BASE}/{media_type}/{tmdb_id}",
            params={
                "api_key": TMDB_API_KEY,
                "append_to_response": "credits,videos,watch/providers"
            }
        )
        d = detail_resp.json()

        # Poster & Backdrop
        poster_path = d.get("poster_path")
        backdrop_path = d.get("backdrop_path")

        # Year
        release_date = d.get("release_date") or d.get("first_air_date") or ""
        year = release_date.split("-")[0] if release_date else ""

        # Runtime
        if media_type == "movie":
            mins = d.get("runtime", 0)
            runtime = f"{mins // 60}h {mins % 60}m" if mins else ""
        else:
            episode_runtime = d.get("episode_run_time", [])
            runtime = f"{episode_runtime[0]}m/ep" if episode_runtime else f"{d.get('number_of_seasons', '?')} Seasons"

        # Genres
        genres = [g["name"] for g in d.get("genres", [])]

        # Cast (top 6)
        credits = d.get("credits", {})
        cast = []
        for member in credits.get("cast", [])[:6]:
            cast.append({
                "name": member.get("name"),
                "character": member.get("character"),
                "photo": f"{IMG_BASE}/w185{member['profile_path']}" if member.get("profile_path") else None
            })

        # Trailer (prefer YouTube official trailers)
        trailer = None
        videos = d.get("videos", {}).get("results", [])
        for v in videos:
            if v.get("site") == "YouTube" and v.get("type") == "Trailer":
                trailer = f"https://www.youtube.com/embed/{v['key']}"
                break
        # Fallback to any YouTube video
        if not trailer:
            for v in videos:
                if v.get("site") == "YouTube":
                    trailer = f"https://www.youtube.com/embed/{v['key']}"
                    break

        # Watch Providers (for India, fallback to US)
        providers_data = d.get("watch/providers", {}).get("results", {})
        region_data = providers_data.get("IN") or providers_data.get("US") or {}
        flatrate = region_data.get("flatrate", [])
        provider_list = []
        for p in flatrate[:5]:
            provider_list.append({
                "name": p.get("provider_name"),
                "logo": f"{IMG_BASE}/w92{p['logo_path']}" if p.get("logo_path") else None
            })

        return {
            "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
            "backdrop": f"{IMG_BASE}/w1280{backdrop_path}" if backdrop_path else None,
            "rating": round(d.get("vote_average", 0), 1) or None,
            "year": year,
            "overview": d.get("overview", ""),
            "genres": genres,
            "runtime": runtime,
            "cast": cast,
            "trailer": trailer,
            "tmdb_id": tmdb_id,
            "media_type": media_type,
            "providers": provider_list
        }

    except Exception as e:
        print(f"[TMDB detail error] {e}")
        return base_data

# ─── Helper: lightweight card info (fast — single API call) ───
def fetch_card_info(title):
    """Fetch only poster, rating, year, tmdb_id, media_type — one API call."""
    try:
        resp = requests.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY,
            "query": title,
            "include_adult": False
        })
        for r in resp.json().get("results", []):
            if r.get("media_type") in ("movie", "tv"):
                poster_path = r.get("poster_path")
                release_date = r.get("release_date") or r.get("first_air_date") or ""
                return {
                    "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
                    "rating": round(r.get("vote_average", 0), 1) or None,
                    "year": release_date.split("-")[0] if release_date else "",
                    "tmdb_id": r.get("id"),
                    "media_type": r.get("media_type"),
                    "overview": r.get("overview", "")
                }
    except Exception as e:
        print(f"[Card info error] {e}")
    return {"poster": None, "rating": None, "year": "", "tmdb_id": None, "media_type": None, "overview": ""}

# ─── Route: Get AI Recommendations (enriched with TMDB) ───
from concurrent.futures import ThreadPoolExecutor

@app.route('/recommend', methods=['POST'])
def get_recommendations():
    data = request.get_json()
    if not data or 'movie' not in data:
        return jsonify({"error": "No movie title provided"}), 400

    movie = data['movie']
    result = cached_recommend(movie)

    if result == ["Movie not found"]:
        # Fallback to TMDB directly
        try:
            # 1. Try to get TMDB recommendations
            tmdb_id, media_type = search_tmdb(movie)
            if tmdb_id:
                rec_resp = requests.get(f"{TMDB_BASE}/{media_type}/{tmdb_id}/recommendations", params={"api_key": TMDB_API_KEY})
                tmdb_recs = rec_resp.json().get("results", [])
                
                # 2. If no recommendations, just return search results for the query
                if not tmdb_recs:
                    search_resp = requests.get(f"{TMDB_BASE}/search/multi", params={"api_key": TMDB_API_KEY, "query": movie, "include_adult": False})
                    tmdb_recs = search_resp.json().get("results", [])
                
                if tmdb_recs:
                    enriched_results = []
                    for r in tmdb_recs[:5]: # Return top 5
                        if r.get("media_type") not in ("movie", "tv"):
                            if "media_type" in r:
                                continue
                        
                        m_type = r.get("media_type", media_type)
                        if m_type not in ("movie", "tv"):
                            continue
                            
                        poster_path = r.get("poster_path")
                        release_date = r.get("release_date") or r.get("first_air_date") or ""
                        enriched_results.append({
                            "title": r.get("title") or r.get("name"),
                            "type": m_type,
                            "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
                            "rating": round(r.get("vote_average", 0), 1) or None,
                            "year": release_date.split("-")[0] if release_date else "",
                            "tmdb_id": r.get("id"),
                            "media_type": m_type
                        })
                    if enriched_results:
                        return jsonify({"results": enriched_results})
        except Exception as e:
            print(f"[TMDB Fallback Error] {e}")
            
        return jsonify({"error": f"'{movie}' not found.", "results": []}), 404
    # Parse titles and types
    parsed = []
    for item in result:
        title = item.split(' (')[0] if ' (' in item else item
        item_type = item.split(' (')[1].replace(')', '') if ' (' in item else "content"
        parsed.append((title, item_type))

    # Fetch all card info in PARALLEL (5 requests at once instead of sequential)
    with ThreadPoolExecutor(max_workers=5) as executor:
        tmdb_results = list(executor.map(lambda p: fetch_card_info(p[0]), parsed))

    enriched_results = []
    for (title, item_type), tmdb_data in zip(parsed, tmdb_results):
        enriched_results.append({
            "title": title,
            "type": item_type,
            **tmdb_data
        })

    return jsonify({"results": enriched_results})

# ─── Route: Trending content ───
@app.route('/trending')
def get_trending():
    """Fetch trending movies & TV shows for the week from TMDB."""
    try:
        resp = requests.get(f"{TMDB_BASE}/trending/all/week", params={
            "api_key": TMDB_API_KEY
        })
        items = resp.json().get("results", [])[:10]

        trending = []
        for item in items:
            media_type = item.get("media_type", "movie")
            title = item.get("title") or item.get("name") or "Unknown"
            poster_path = item.get("poster_path")
            backdrop_path = item.get("backdrop_path")
            release_date = item.get("release_date") or item.get("first_air_date") or ""

            trending.append({
                "tmdb_id": item.get("id"),
                "title": title,
                "media_type": media_type,
                "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
                "backdrop": f"{IMG_BASE}/w1280{backdrop_path}" if backdrop_path else None,
                "rating": round(item.get("vote_average", 0), 1) or None,
                "year": release_date.split("-")[0] if release_date else "",
                "overview": item.get("overview", ""),
                "type": media_type
            })

        return jsonify({"trending": trending})
    except Exception as e:
        print(f"[Trending error] {e}")
        return jsonify({"trending": []}), 500

# ─── Route: Search autocomplete ───
@app.route('/autocomplete')
def autocomplete():
    """Return quick search suggestions from TMDB."""
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({"suggestions": []})

    try:
        resp = requests.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY,
            "query": q,
            "include_adult": False
        })
        items = resp.json().get("results", [])

        suggestions = []
        for item in items[:8]:
            if item.get("media_type") not in ("movie", "tv"):
                continue
            title = item.get("title") or item.get("name") or ""
            poster_path = item.get("poster_path")
            release_date = item.get("release_date") or item.get("first_air_date") or ""

            suggestions.append({
                "title": title,
                "media_type": item.get("media_type"),
                "year": release_date.split("-")[0] if release_date else "",
                "poster": f"{IMG_BASE}/w92{poster_path}" if poster_path else None
            })

        return jsonify({"suggestions": suggestions})
    except Exception as e:
        print(f"[Autocomplete error] {e}")
        return jsonify({"suggestions": []})

# ─── Route: Get full details for a specific TMDB item ───
@app.route('/details/<media_type>/<int:tmdb_id>')
def get_details(media_type, tmdb_id):
    """Fetch full details including trailer, cast, providers for a TMDB item."""
    if media_type not in ("movie", "tv"):
        return jsonify({"error": "Invalid media type"}), 400

    try:
        detail_resp = requests.get(
            f"{TMDB_BASE}/{media_type}/{tmdb_id}",
            params={
                "api_key": TMDB_API_KEY,
                "append_to_response": "credits,videos,watch/providers,recommendations"
            }
        )
        d = detail_resp.json()

        poster_path = d.get("poster_path")
        backdrop_path = d.get("backdrop_path")
        release_date = d.get("release_date") or d.get("first_air_date") or ""

        # Runtime
        if media_type == "movie":
            mins = d.get("runtime", 0)
            runtime = f"{mins // 60}h {mins % 60}m" if mins else ""
        else:
            ep_rt = d.get("episode_run_time", [])
            runtime = f"{ep_rt[0]}m/ep" if ep_rt else f"{d.get('number_of_seasons', '?')} Seasons"

        # Genres
        genres = [g["name"] for g in d.get("genres", [])]

        # Cast
        cast = []
        for m in d.get("credits", {}).get("cast", [])[:8]:
            cast.append({
                "name": m.get("name"),
                "character": m.get("character"),
                "photo": f"{IMG_BASE}/w185{m['profile_path']}" if m.get("profile_path") else None
            })

        # Director
        director = ""
        for m in d.get("credits", {}).get("crew", []):
            if m.get("job") == "Director":
                director = m.get("name", "")
                break

        # Trailer
        trailer = None
        for v in d.get("videos", {}).get("results", []):
            if v.get("site") == "YouTube" and v.get("type") == "Trailer":
                trailer = f"https://www.youtube.com/embed/{v['key']}"
                break
        if not trailer:
            for v in d.get("videos", {}).get("results", []):
                if v.get("site") == "YouTube":
                    trailer = f"https://www.youtube.com/embed/{v['key']}"
                    break

        # Providers
        providers_data = d.get("watch/providers", {}).get("results", {})
        region_data = providers_data.get("IN") or providers_data.get("US") or {}
        providers = [
            {"name": p.get("provider_name"), "logo": f"{IMG_BASE}/w92{p['logo_path']}" if p.get("logo_path") else None}
            for p in region_data.get("flatrate", [])[:5]
        ]

        # TMDB Recommendations
        tmdb_recs = []
        for r in d.get("recommendations", {}).get("results", [])[:6]:
            rp = r.get("poster_path")
            rd = r.get("release_date") or r.get("first_air_date") or ""
            tmdb_recs.append({
                "tmdb_id": r.get("id"),
                "title": r.get("title") or r.get("name"),
                "media_type": r.get("media_type", media_type),
                "poster": f"{IMG_BASE}/w500{rp}" if rp else None,
                "rating": round(r.get("vote_average", 0), 1) or None,
                "year": rd.split("-")[0] if rd else ""
            })

        return jsonify({
            "title": d.get("title") or d.get("name"),
            "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
            "backdrop": f"{IMG_BASE}/w1280{backdrop_path}" if backdrop_path else None,
            "rating": round(d.get("vote_average", 0), 1) or None,
            "year": release_date.split("-")[0] if release_date else "",
            "overview": d.get("overview", ""),
            "genres": genres,
            "runtime": runtime,
            "cast": cast,
            "director": director,
            "trailer": trailer,
            "providers": providers,
            "tmdb_recommendations": tmdb_recs,
            "tagline": d.get("tagline", "")
        })

    except Exception as e:
        print(f"[Details error] {e}")
        return jsonify({"error": "Failed to fetch details"}), 500


# ─── Route: Smart Discover (Filter based) ───
@app.route('/discover', methods=['POST'])
def discover_content():
    data = request.get_json()
    content_type = data.get('content_type', 'Movie')
    genre = data.get('genre', '')
    mood = data.get('mood', '')

    media_type = 'tv' if content_type in ['Series', 'Anime', 'K-Drama'] else 'movie'
    
    params = {
        "api_key": TMDB_API_KEY,
        "sort_by": "popularity.desc",
        "vote_count.gte": 5, # Lowered from 50 so niche K-Dramas/Anime don't fail
        "include_adult": False,
        "page": 1
    }

    if content_type == 'Anime':
        params["with_genres"] = "16"
        params["with_original_language"] = "ja"
    elif content_type == 'K-Drama':
        params["with_original_language"] = "ko"
        
    genre_map = {
        "Action": "28" if media_type == 'movie' else "10759",
        "Romance": "10749",
        "Thriller": "53",
        "Comedy": "35",
        "Horror": "27",
        "Sci-Fi": "878" if media_type == 'movie' else "10765",
        "Drama": "18"
    }
    if genre in genre_map:
        if "with_genres" in params:
            params["with_genres"] += f",{genre_map[genre]}"
        else:
            params["with_genres"] = genre_map[genre]

    # Map Moods to secondary genres instead of restrictive keywords
    mood_map = {
        "Dark": "53", # Thriller
        "Motivational": "36", # History
        "Feel Good": "35", # Comedy
        "Mind-Bending": "878" if media_type == 'movie' else "10765", # Sci-Fi
        "Emotional": "18", # Drama
        "Suspenseful": "9648", # Mystery
    }
    if mood in mood_map:
        mood_genre = mood_map[mood]
        current_genres = params.get("with_genres", "")
        if mood_genre not in current_genres:
            if current_genres:
                params["with_genres"] += f",{mood_genre}"
            else:
                params["with_genres"] = mood_genre

    try:
        resp = requests.get(f"{TMDB_BASE}/discover/{media_type}", params=params)
        results = resp.json().get("results", [])
        
        # If the strict combination yields 0 results, relax the mood and try again
        if not results and mood in mood_map:
            params["with_genres"] = params["with_genres"].replace(f",{mood_genre}", "").replace(mood_genre, "")
            resp = requests.get(f"{TMDB_BASE}/discover/{media_type}", params=params)
            results = resp.json().get("results", [])
        
        enriched_results = []
        for r in results[:5]:
            poster_path = r.get("poster_path")
            release_date = r.get("release_date") or r.get("first_air_date") or ""
            enriched_results.append({
                "title": r.get("title") or r.get("name"),
                "type": "content", 
                "poster": f"{IMG_BASE}/w500{poster_path}" if poster_path else None,
                "rating": round(r.get("vote_average", 0), 1) or None,
                "year": release_date.split("-")[0] if release_date else "",
                "tmdb_id": r.get("id"),
                "media_type": media_type
            })
        
        for item in enriched_results:
            if content_type == 'Anime': item['type'] = 'anime'
            elif content_type == 'K-Drama': item['type'] = 'kdrama'
            elif content_type == 'Series': item['type'] = 'webseries'
            else: item['type'] = 'movie'

        return jsonify({"results": enriched_results})
    except Exception as e:
        print(f"[Discover Error] {e}")
        return jsonify({"error": "Failed to discover content", "results": []}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)