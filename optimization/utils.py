import math

# Tortuosity Factor for Urban Areas (Colombo estimate)
TORTUOSITY_FACTOR = 1.4

def haversine_distance(coord1, coord2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    coord1, coord2: dict with 'lat', 'lng' or 'latitude', 'longitude' keys
    Returns pure physical radius distance in km.
    """
    # Normalize keys
    lat1 = coord1.get('lat') or coord1.get('latitude')
    lon1 = coord1.get('lng') or coord1.get('longitude')
    lat2 = coord2.get('lat') or coord2.get('latitude')
    lon2 = coord2.get('lng') or coord2.get('longitude')
    
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        raise ValueError("Invalid coordinates format")

    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [float(lat1), float(lon1), float(lat2), float(lon2)])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers.
    return c * r

def calculate_true_detour(commuter_route, pickup, dropoff):
    """
    Calculates the exact extra km required using the TORTUOSITY_FACTOR
    commuter_route: dict with 'start' and 'end' coordinates.
    pickup: coordinates of pickup location
    dropoff: coordinates of dropoff location
    
    Formula:
    original_dist = haversine(start, end)
    new_dist = haversine(start, pick) + haversine(pick, drop) + haversine(drop, end)
    raw_detour = new_dist - original_dist
    final_detour = raw_detour * 1.4
    """
    start = commuter_route['start']
    end = commuter_route['end']
    
    original_dist = haversine_distance(start, end)
    
    leg1 = haversine_distance(start, pickup)
    leg2 = haversine_distance(pickup, dropoff)
    leg3 = haversine_distance(dropoff, end)
    
    new_dist = leg1 + leg2 + leg3
    
    raw_detour = new_dist - original_dist
    
    # Optional logic: Handle tiny floats going negative due to precision
    if raw_detour < 0:
        raw_detour = 0
        
    final_detour = raw_detour * TORTUOSITY_FACTOR
    
    return final_detour
