import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const RequestForm = () => {
    const [formData, setFormData] = useState({
        pickupLat: '',
        pickupLng: '',
        dropoffLat: '',
        dropoffLng: '',
        size: 'Small'
    });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'deliveries'), {
                uid: auth.currentUser?.uid,
                pickup_loc: { lat: parseFloat(formData.pickupLat), lng: parseFloat(formData.pickupLng) },
                dropoff_loc: { lat: parseFloat(formData.dropoffLat), lng: parseFloat(formData.dropoffLng) },
                size: formData.size,
                status: 'pending',
                created_at: new Date()
            });
            alert('Request submitted!');
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error submitting request');
        }
    };

    return (
        <div className="container fade-in">
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '2rem' }}>Request Delivery</h2>
                <form onSubmit={handleSubmit}>

                    <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Pickup Location</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Latitude</label>
                            <input type="number" step="any" className="input-field"
                                value={formData.pickupLat} onChange={e => setFormData({ ...formData, pickupLat: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="label">Longitude</label>
                            <input type="number" step="any" className="input-field"
                                value={formData.pickupLng} onChange={e => setFormData({ ...formData, pickupLng: e.target.value })} required
                            />
                        </div>
                    </div>

                    <h4 style={{ marginBottom: '1rem', marginTop: '1rem', color: 'var(--secondary)' }}>Dropoff Location</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Latitude</label>
                            <input type="number" step="any" className="input-field"
                                value={formData.dropoffLat} onChange={e => setFormData({ ...formData, dropoffLat: e.target.value })} required
                            />
                        </div>
                        <div>
                            <label className="label">Longitude</label>
                            <input type="number" step="any" className="input-field"
                                value={formData.dropoffLng} onChange={e => setFormData({ ...formData, dropoffLng: e.target.value })} required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                        <label className="label">Parcel Size</label>
                        <select className="input-field" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })}>
                            <option value="Small">Small (Envelope/Document)</option>
                            <option value="Medium">Medium (Box)</option>
                            <option value="Large">Large (Equipment)</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, var(--secondary), var(--primary))' }}>
                        Submit Request
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RequestForm;
