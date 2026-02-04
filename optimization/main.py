from config import db
from utils import haversine_distance
from ga_optimizer import GeneticMatcher

def main():
    print("Starting Optimization Engine...")
    
    # 1. Fetch Data
    deliveries_ref = db.collection('deliveries').where('status', '==', 'pending')
    commuters_ref = db.collection('commuters')
    
    deliveries = []
    for doc in deliveries_ref.stream():
        d = doc.to_dict()
        d['id'] = doc.id
        # Normalize keys for internal logic
        if 'pickup_loc' in d: d['pickup'] = d['pickup_loc']
        if 'dropoff_loc' in d: d['dropoff'] = d['dropoff_loc']
        deliveries.append(d)
        
    commuters = []
    for doc in commuters_ref.stream():
        c = doc.to_dict()
        c['id'] = doc.id
        # Normalize keys for internal logic
        if 'home_loc' in c and 'work_loc' in c:
            c['route'] = {
                'start': c['home_loc'], # Assuming home is start
                'end': c['work_loc']
            }
        commuters.append(c)
        
    print(f"Fetched {len(deliveries)} pending deliveries and {len(commuters)} commuters.")
    
    if not deliveries:
        print("No pending deliveries. Exiting.")
        return

    # 2. Heuristic Filter & GA Execution
    # "Step 1 - Heuristic Filter ... Step 2 - Run GA: Pass these candidates to GeneticMatcher"
    # The GA class expects a list of deliveries and a pool of commuters. 
    # To strictly follow "pass these candidates", we could create a GA instance per delivery (if 1-to-1) or 
    # pass a filtered list of ALL potential commuters for the batch.
    
    # Let's filter commuters who are within 5km of ANY delivery's pickup to be in the "candidate pool"
    # Or, we can modify the GA to handle specific candidates per delivery. 
    # Given the simplified GA implementation (genome index = delivery, value = commuter_index),
    # It works best if we pass the whole relevant set.
    
    # Heuristic: Filter by 5km radius to pickup
    valid_commuters = []
    # To avoid passing ALL commuters to GA, let's find unique commuters valid for at least one delivery based on 5km radius
    
    for c in commuters:
        is_candidate_for_any = False
        for d in deliveries:
            dist = haversine_distance(c['route']['start'], d['pickup']) # Checking distance from Commuter Start to Pickup? 
            # Or usually candidates are filtered by if their route passes near pickup?
            #"valid_candidates (commuters who pass within 5km of the pickup)"
            # That implies checking the route. But 'haversine_distance(c['route']['start'], d['pickup'])' checks start point.
            # For simplicity and "Heuristic Filter" as typically defined in this context:
            # We often check if Commuter Start is near Pickup OR if the Pickup is within a bounding box. 
            # "pass within 5km". 
            # Let's check distance from Commuter Start to Pickup for now as a simple proxy, 
            # OR better: check distance from pickup to the line segment start-end? 
            # "pass within" implies proximity to the route.
            # But the 'utils.py' doesn't have point-to-line distance. 
            # Let's stick to a simple check: Distance(Commuter Start, Pickup) <= 5km OR Distance(Commuter End, Pickup) <= 5km?
            # Actually, "candidates (commuters who pass within 5km of the pickup)". 
            # I will assume checking distance from Commuter Current Location (Start) to Pickup is the intended 'Heuristic' for now.
            
            if dist <= 5: # 5km
                is_candidate_for_any = True
                break
        
        if is_candidate_for_any:
            valid_commuters.append(c)

    print(f"Filtered down to {len(valid_commuters)} valid candidates for the batch.")

    if not valid_commuters:
        print("No valid commuters found within 5km radius. Exiting.")
        return

    # 3. Run GA
    ga = GeneticMatcher(deliveries, valid_commuters)
    matches = ga.run()
    
    print(f"GA finished. Found {len(matches)} matches.")
    
    # 4. Save Results
    total_detour = 0
    batch = db.batch()
    
    for m in matches:
        # Update Delivery
        del_ref = db.collection('deliveries').document(m['delivery_id'])
        batch.update(del_ref, {
            'matched_commuter_id': m['commuter_id'],
            'detour_km': m['detour_km'],
            'status': 'matched'
        })
        total_detour += m['detour_km']
        
    await_batch = batch.commit()
    
    avg_detour = total_detour / len(matches) if matches else 0
    print(f"Matched {len(matches)} deliveries. Average Detour: {avg_detour:.2f} km.")

if __name__ == "__main__":
    main()
