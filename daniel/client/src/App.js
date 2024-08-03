import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import MainApp from './components/MainApp'; 

const App = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(loggedIn);
    }, []);

    const handleLogin = () => {
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
    };

    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route
                path="/login"
                element={<Login onLogin={handleLogin} />}
            />
            <Route
                path="/mainapp"
                element={
                    isLoggedIn ? (
                        <MainApp onLogout={handleLogout} />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default App;