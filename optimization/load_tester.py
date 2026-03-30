import time
import random
import concurrent.futures
from datetime import datetime
from config import db

# Configuration for Colombo boundaries
COLOMBO_BOUNDS = {
    'min_lat': 6.90,
    'max_lat': 6.95,
    'min_lng': 79.84,
    'max_lng': 79.88
}

def generate_random_coordinate():
    """Generate a random latitude and longitude within Colombo boundaries."""
    lat = random.uniform(COLOMBO_BOUNDS['min_lat'], COLOMBO_BOUNDS['max_lat'])
    lng = random.uniform(COLOMBO_BOUNDS['min_lng'], COLOMBO_BOUNDS['max_lng'])
    return lat, lng

def create_mock_delivery(index):
    """Generates a realistic pending delivery dictionary payload."""
    p_lat, p_lng = generate_random_coordinate()
    d_lat, d_lng = generate_random_coordinate()
    
    return {
        'pickup_loc': {
            'address': f"Load Test Pickup Route {index}",
            'lat': p_lat,
            'lng': p_lng
        },
        'dropoff_loc': {
            'address': f"Load Test Dropoff Destination {index}",
            'lat': d_lat,
            'lng': d_lng
        },
        'packageType': random.choice(['Small', 'Medium', 'Large', 'Fragile']),
        'urgencyLevel': random.choice(['Standard', 'Express']),
        'estimated_cost': random.randint(150, 1000),
        'status': 'pending',
        'createdAt': datetime.utcnow().isoformat() + "Z"
    }

def write_to_firestore(delivery_data):
    """Writes exactly one document to the Firebase collection."""
    try:
        db.collection('deliveries').add(delivery_data)
        return True
    except Exception as e:
        print(f"Error writing document: {e}")
        return False

def run_stress_test(num_requests=100, max_workers=20):
    """Executes the asynchronous load test across concurrent thread pools."""
    print(f"\n [LOAD TEST INITIALIZED] - Spawning {num_requests} concurrent simulated deliveries...")
    
    start_time = time.time()
    start_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    print(f"Start Time: {start_timestamp}")

    # Generate documents
    documents = [create_mock_delivery(i) for i in range(1, num_requests + 1)]

    # Fire asynchronously
    success_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks to executor
        futures = [executor.submit(write_to_firestore, doc) for doc in documents]
        
        # Monitor completion dynamically
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                success_count += 1

    end_time = time.time()
    end_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    
    print(f"\n [LOAD TEST COMPLETED]")
    print(f" End Time: {end_timestamp}")
    print(f" Summary:")
    print(f"  - Total Requests Sent: {num_requests}")
    print(f"  - Successful Writes: {success_count}")
    print(f"  - Total Execution Time: {(end_time - start_time):.2f} seconds")
    print(f"  - Throughput: {(success_count / (end_time - start_time)):.2f} requests/second\n")

if __name__ == "__main__":
    run_stress_test(num_requests=100)
