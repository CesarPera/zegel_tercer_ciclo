import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    const handleNavigate = () => {
        navigate('/login'); // Redirige al login en lugar de /app
    };

    return (
        <div>
            <h1>Home Page</h1>
            <button onClick={handleNavigate}>Go to Login</button>
        </div>
    );
};

export default Home;