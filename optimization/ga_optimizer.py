import random
import numpy as np
from utils import calculate_detour, haversine_distance

class GeneticMatcher:
    def __init__(self, deliveries, commuters, population_size=50, generations=100, mutation_rate=0.1):
        self.deliveries = deliveries # List of delivery dicts
        self.commuters = commuters   # List of commuter dicts (candidates)
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = mutation_rate
        
        # Map IDs to indices for easier processing if needed
        self.commuter_map = {c['id']: c for c in commuters}
        self.delivery_map = {d['id']: d for d in deliveries}

    def initial_population(self):
        """
        Genome: A list where index i corresponds to deliveries[i]. 
        Value is the index of the assigned commuter in self.commuters.
        """
        population = []
        for _ in range(self.population_size):
            genome = []
            for _ in self.deliveries:
                # Randomly assign a commuter from the available list
                # Note: This simple version assumes any commuter can take any delivery
                # In main.py we filter by radius, so 'commuters' passed here are valid candidates?
                # Actually, the requirement says "Genome: A list of integers where index=RequestID and value=CommuterID."
                # But filter happens per delivery. So not all commuters are valid for all deliveries.
                # To simplify for the "Core Engine" task:
                # We will assume 'commuters' passed to this class are the POOL of all candidates available for these deliveries.
                # If a commuter is invalid for a specific delivery, we can penalize fitness heavily.
                if not self.commuters:
                    genome.append(-1) # No commuter available
                else:
                    genome.append(random.randint(0, len(self.commuters) - 1))
            population.append(genome)
        return population

    def calculate_fitness(self, genome):
        total_detour = 0
        penalty = 0

        # Genome is list of commuter indices for each delivery
        for i, commuter_idx in enumerate(genome):
            if commuter_idx == -1:
                penalty += 1000 # Unmatched penalty
                continue
                
            delivery = self.deliveries[i]
            commuter = self.commuters[commuter_idx]
            
            # 1. Calculate Detour
            detour = calculate_detour(commuter['route'], delivery['pickup'], delivery['dropoff'])
            
            # 2. Check Constraints
            # Calculate original route distance for percentage check
            start = commuter['route']['start']
            end = commuter['route']['end']
            original_dist = haversine_distance(start, end)
            
            # Avoid division by zero
            if original_dist == 0: original_dist = 0.001
                
            detour_percentage = (detour / original_dist) * 100
            
            if detour_percentage > 15:
                penalty += 500 # Massive penalty for >15% detour
            
            total_detour += detour

        return 1 / (total_detour + penalty + 1) # Minimize cost = Maximize fitness

    def select_parent(self, population, fitness_scores):
        # Roulette wheel selection
        total_fitness = sum(fitness_scores)
        if total_fitness == 0:
            return random.choice(population)
            
        pick = random.uniform(0, total_fitness)
        current = 0
        for i, score in enumerate(fitness_scores):
            current += score
            if current > pick:
                return population[i]
        return population[-1]

    def crossover(self, parent1, parent2):
        # Single-point crossover
        if len(parent1) < 2:
            return parent1
            
        point = random.randint(1, len(parent1) - 1)
        child = parent1[:point] + parent2[point:]
        return child

    def mutate(self, genome):
        for i in range(len(genome)):
            if random.random() < self.mutation_rate:
                if self.commuters:
                     genome[i] = random.randint(0, len(self.commuters) - 1)
        return genome

    def run(self):
        population = self.initial_population()
        
        for _ in range(self.generations):
            fitness_scores = [self.calculate_fitness(genome) for genome in population]
            
            # Elitism: keep best
            best_idx = np.argmax(fitness_scores)
            best_genome = population[best_idx]
            
            new_population = [best_genome]
            
            while len(new_population) < self.population_size:
                parent1 = self.select_parent(population, fitness_scores)
                parent2 = self.select_parent(population, fitness_scores)
                child = self.crossover(parent1, parent2)
                child = self.mutate(child)
                new_population.append(child)
            
            population = new_population

        # Return best solution
        fitness_scores = [self.calculate_fitness(genome) for genome in population]
        best_idx = np.argmax(fitness_scores)
        
        # Decode best genome
        best_genome = population[best_idx]
        matches = []
        for i, commuter_idx in enumerate(best_genome):
            if commuter_idx != -1:
                delivery = self.deliveries[i]
                commuter = self.commuters[commuter_idx]
                detour = calculate_detour(commuter['route'], delivery['pickup'], delivery['dropoff'])
                
                # Double check specific validity here if needed, but GA should have filtered bad ones via penalty
                matches.append({
                    'delivery_id': delivery['id'],
                    'commuter_id': commuter['id'],
                    'detour_km': detour
                })
                
        return matches
