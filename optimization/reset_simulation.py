import firebase_admin
from firebase_admin import credentials, firestore

# 1. Initialize Firebase (Same as your config.py)
cred = credentials.Certificate("../serviceAccountKey.json") # Adjust path if needed
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def reset_all_deliveries():
    print("🔄 Resetting simulation data...")
    
    # Get all delivery documents
    deliveries_ref = db.collection("deliveries")
    docs = deliveries_ref.stream()
    
    count = 0
    batch = db.batch()
    
    for doc in docs:
        # Update every document to have status="pending" and remove old match data
        doc_ref = deliveries_ref.document(doc.id)
        batch.update(doc_ref, {
            "status": "pending",
            "matched_commuter_id": firestore.DELETE_FIELD,
            "detour_km": firestore.DELETE_FIELD
        })
        count += 1

    # Commit the batch
    batch.commit()
    print(f"✅ Successfully reset {count} deliveries to 'pending' status.")

if __name__ == "__main__":
    reset_all_deliveries()