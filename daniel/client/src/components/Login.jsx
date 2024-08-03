import React, { useState } from 'react';
import Axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
    const [correo, setCorreo] = useState('');
    const [contraseña, setContraseña] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        Axios.post("http://localhost:3001/login", { correo, contraseña })
            .then((response) => {
                if (response.data.success) {
                    if (typeof onLogin === 'function') {
                        onLogin();
                        Swal.fire({
                            icon: 'success',
                            title: "Exito al ingresar",
                            text: "Credenciales correctas",
                        });
                    }
                    navigate('/mainapp'); // Redirige a MainApp después del login
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Credenciales incorrectas',
                    });
                }
            })
            .catch((error) => {
                console.error('Error al hacer login:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo conectar al servidor. Intente más tarde.',
                });
            });
    };

    return (
        <div className="login-container">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label htmlFor="correo">Correo:</label>
                    <input
                        type="email"
                        id="correo"
                        name="correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="contraseña">Contraseña:</label>
                    <input
                        type="password"
                        id="contraseña"
                        name="contraseña"
                        value={contraseña}
                        onChange={(e) => setContraseña(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Iniciar Sesión</button>
            </form>
        </div>
    );
};

export default Login;