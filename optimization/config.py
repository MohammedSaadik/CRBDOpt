import firebase_admin
from firebase_admin import credentials, firestore
import googlemaps
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase
cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
if not cred_path:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS not set in .env")

# Handle relative path for service account
base_path = os.path.dirname(os.path.abspath(__file__))
abs_cred_path = os.path.normpath(os.path.join(base_path, cred_path))

if not firebase_admin._apps:
    cred = credentials.Certificate(abs_cred_path)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Initialize Google Maps
api_key = os.getenv('GOOGLE_MAPS_API_KEY')
gmaps = None
if api_key:
    gmaps = googlemaps.Client(key=api_key)
else:
    print("Warning: GOOGLE_MAPS_API_KEY not set.")
