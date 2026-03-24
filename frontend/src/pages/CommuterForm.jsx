import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CommuterForm = () => {
    const [formData, setFormData] = useState({
        homeLat: '',
        homeLng: '',
        workLat: '',
        workLng: '',
        detourTolerance: 2
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const docRef = await addDoc(collection(db, 'commuters'), {
                uid: auth.currentUser?.uid,
                home_loc: { lat: parseFloat(formData.homeLat), lng: parseFloat(formData.homeLng) },
                work_loc: { lat: parseFloat(formData.workLat), lng: parseFloat(formData.workLng) },
                detour_tolerance_km: parseFloat(formData.detourTolerance),
                created_at: new Date()
            });
            alert('Commuter profile created!');
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error creating profile');
        }
    };

    return (
        <div className="container fade-in">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Commuter Onboarding</h2>
                <form onSubmit={handleSubmit}>

                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Home Location</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Latitude</label>
                            <input type="number" step="any" className="input-field" placeholder="6.9271"
                                value={formData.homeLat} onChange={e => setFormData({ ...formData, homeLat: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="label">Longitude</label>
                            <input type="number" step="any" className="input-field" placeholder="79.8612"
                                value={formData.homeLng} onChange={e => setFormData({ ...formData, homeLng: e.target.value })} required
                            />
                        </div>
                    </div>

                    <h4 style={{ marginBottom: '1rem', marginTop: '1rem', color: 'var(--primary)' }}>Work Location</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Latitude</label>
                            <input type="number" step="any" className="input-field" placeholder="6.9271"
                                value={formData.workLat} onChange={e => setFormData({ ...formData, workLat: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="label">Longitude</label>
                            <input type="number" step="any" className="input-field" placeholder="79.8612"
                                value={formData.workLng} onChange={e => setFormData({ ...formData, workLng: e.target.value })} required
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                        <label className="label">Detour Tolerance: {formData.detourTolerance} km</label>
                        <input type="range" min="0" max="10" step="0.1" className="slider"
                            value={formData.detourTolerance} onChange={e => setFormData({ ...formData, detourTolerance: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Start Driving
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CommuterForm;
