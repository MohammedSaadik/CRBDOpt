import time
import threading
from config import db
from utils import haversine_distance
from ga_optimizer import GeneticMatcher

# Global lock to prevent race conditions from concurrent Firestore snapshots
optimization_lock = threading.Lock()

def run_optimization_cycle(trigger_name):
    with optimization_lock:
        print(f"\n[{'='*40}]")
        print(f"[OPTIMIZATION CYCLE TRIGGERED BY: {trigger_name.upper()}]")
        print(f"[{'='*40}]")
        
        # 1. Fetch pending deliveries
        deliveries_ref = db.collection('deliveries').where('status', '==', 'pending')
        deliveries = []
        for doc in deliveries_ref.stream():
            d = doc.to_dict()
            d['id'] = doc.id
            if 'pickup_loc' in d: d['pickup'] = d['pickup_loc']
            if 'dropoff_loc' in d: d['dropoff'] = d['dropoff_loc']
            deliveries.append(d)
            
        if not deliveries:
            print("No pending deliveries found in the database. Cycle ending.")
            return

        # 2. Fetch active commuters
        commuters_ref = db.collection('commuters').where('status', '==', 'active')
        commuters = []
        for doc in commuters_ref.stream():
            c = doc.to_dict()
            c['id'] = c.get('commuterId', doc.id)
            if 'home_loc' in c and 'work_loc' in c:
                c['route'] = {
                    'start': c['home_loc'],
                    'end': c['work_loc']
                }
            commuters.append(c)

        print(f"Fetched {len(deliveries)} pending deliveries and {len(commuters)} active commuters.")

        # 3. Heuristic Filter: 5km radius to pickup
        valid_commuters = []
        for c in commuters:
            is_candidate_for_any = False
            if 'route' not in c:
                continue
                
            for d in deliveries:
                if 'pickup' in d:
                    dist = haversine_distance(c['route']['start'], d['pickup'])
                    if dist <= 5: # 5km
                        is_candidate_for_any = True
                        break
            
            if is_candidate_for_any:
                valid_commuters.append(c)

        print(f"Filtered down to {len(valid_commuters)} valid commuter candidates for this batch.")

        if not valid_commuters:
            print("No valid commuters found within 5km radius of any pending delivery.")
            return

        # 4. Run GA
        print("Starting Genetic Algorithm...")
        ga = GeneticMatcher(deliveries, valid_commuters)
        matches = ga.run()
        
        print(f"GA finished. Found {len(matches)} matches.")
        
        # 5. Save Results
        if not matches:
            print("No valid matches generated this round.")
            return

        accepted_count = 0
        total_detour = 0
        batch = db.batch()
        
        for m in matches:
            # Retrieve commuter to check tolerance limit
            c = next((c for c in valid_commuters if c['id'] == m['commuter_id']), None)
            tolerance = float(c.get('detourTolerance', 5)) if c else 5.0
            
            if m['detour_km'] <= tolerance:
                del_ref = db.collection('deliveries').document(m['delivery_id'])
                batch.update(del_ref, {
                    'proposed_commuter_id': m['commuter_id'],
                    'detour_km': m['detour_km'],
                    'status': 'proposed'
                })
                total_detour += m['detour_km']
                accepted_count += 1
                print(f"-> Proposed Match: Delivery {m['delivery_id']} assigned to Commuter {m['commuter_id']} (Detour: {m['detour_km']:.2f} km)")
            else:
                print(f"Best match exceeded tolerance ({m['detour_km']:.2f} km > {tolerance} km). Delivery {m['delivery_id']} remains pending.")
            
        batch.commit()
        
        avg_detour = total_detour / accepted_count if accepted_count > 0 else 0
        print(f"Committed {accepted_count} deliveries. Average Detour: {avg_detour:.2f} km.")
        print(f"[{'='*40}]\n")

def on_delivery_snapshot(col_snapshot, changes, read_time):
    # Check if this snapshot contains 'ADDED' events indicating new pending requests
    for change in changes:
        if change.type.name == 'ADDED':
            run_optimization_cycle("New Package")
            return

def on_commuter_snapshot(col_snapshot, changes, read_time):
    # Check if this snapshot contains 'ADDED' events indicating new active commuters
    for change in changes:
        if change.type.name == 'ADDED':
            run_optimization_cycle("New Commuter")
            return

def main():
    print("Starting Bi-Directional Optimization Engine...")
    print("Attaching real-time listeners for Packages and Commuters...\n")
    
    # Listen to 'pending' deliveries
    deliveries_query = db.collection('deliveries').where('status', '==', 'pending')
    deliveries_watch = deliveries_query.on_snapshot(on_delivery_snapshot)
    
    # Listen to 'active' commuters
    commuters_query = db.collection('commuters').where('status', '==', 'active')
    commuters_watch = commuters_query.on_snapshot(on_commuter_snapshot)
    
    # Keep the script alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down Optimization Engine...")

if __name__ == "__main__":
    main()
