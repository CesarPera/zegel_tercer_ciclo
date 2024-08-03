// src/components/MainApp.jsx
import '../App.css';
import { useState, useEffect } from 'react';
import Axios from 'axios';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from '../logo.png';
import Login from './Login'; // Asegúrate de usar la ruta correcta

function MainApp() {
    const [detallesEventos, setDetallesEventos] = useState([]);
    const [formValues, setFormValues] = useState({
        id_inventario: 1,
        cantidad_A: 0,
        cantidad_B: 0,
        cantidad_C: 0,
        estado: '',
        nombre_artista: ''
    });
    const [totalCompra, setTotalCompra] = useState(null);
    const [ticketId, setTicketId] = useState(null);
    const [showPagoDetails, setShowPagoDetails] = useState(false);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
        setIsAuthenticated(loggedIn);

        if (loggedIn) {
            getDetallesEvento();
        }
    }, []);

    const getDetallesEvento = () => {
        Axios.get("http://localhost:3001/detalles_evento")
            .then((response) => {
                setDetallesEventos(response.data);
            })
            .catch((error) => {
                console.error('Estamos sin conexion :C', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Regrese mas tarde....',
                });
            });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'id_inventario') {
            const selectedEvento = detallesEventos.find(evento => evento.id_inventario === parseInt(value));
            if (selectedEvento) {
                Axios.get(`http://localhost:3001/inventario/${value}`)
                    .then((response) => {
                        const { nombre_artista } = response.data;
                        setFormValues({
                            ...formValues,
                            id_inventario: parseInt(value),
                            cantidad_A: selectedEvento.cantidad_A || 0,
                            cantidad_B: selectedEvento.cantidad_B || 0,
                            cantidad_C: selectedEvento.cantidad_C || 0,
                            nombre_artista: nombre_artista
                        });
                    })
                    .catch((error) => {
                        console.error('Error al obtener el nombre del artista:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'No se pudo obtener el nombre del artista. Intente más tarde.',
                        });
                    });
            } else {
                setFormValues({
                    ...formValues,
                    id_inventario: parseInt(value),
                    cantidad_A: 0,
                    cantidad_B: 0,
                    cantidad_C: 0,
                    nombre_artista: ''
                });
            }
        } else {
            setFormValues({
                ...formValues,
                [name]: parseInt(value) || 0,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const { cantidad_A, cantidad_B, cantidad_C } = formValues;
        if (cantidad_A <= 0 && cantidad_B <= 0 && cantidad_C <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Porfavor no ingresar números negativos o nulos',
            });
            return;
        }

        let estado = '';
        if (cantidad_A > 0 || cantidad_B > 0 || cantidad_C > 0) {
            estado = 'Registrado';
        }

        const formData = {
            ...formValues,
            estado: estado
        };

        Axios.post("http://localhost:3001/ticket", formData)
            .then((response) => {
                const { total, ticketId } = response.data;
                setTotalCompra(total);
                setTicketId(ticketId);
                setShowPagoDetails(true);
                setFormValues({
                    ...formValues,
                    cantidad_A: 0,
                    cantidad_B: 0,
                    cantidad_C: 0,
                    estado: '',
                    nombre_artista: formValues.nombre_artista
                });
                setTicketDetails(formData);
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: `Ticket registrado correctamente. Total: S/ ${total}`,
                });
            })
            .catch((error) => {
                if (error.response && error.response.status === 400) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No hay suficiente stock para las cantidades seleccionadas',
                    });
                } else {
                    console.error('Error al registrar el ticket:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo registrar el ticket. Intente más tarde.',
                    });
                }
            });
    };

    const handleConfirmCompra = () => {
        const fechaPago = new Date().toISOString().slice(0, 10);

        const pagoData = {
            id_ticket: ticketId,
            id_inventario: formValues.id_inventario,
            fecha_pago: fechaPago,
            monto_total: totalCompra
        };

        Axios.post("http://localhost:3001/pago", pagoData)
            .then((response) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: `Pago registrado correctamente.`,
                });
                setShowPagoDetails(false);
                setTotalCompra(null);
                setTicketId(null);
                setTicketDetails(null);
            })
            .catch((error) => {
                console.error('Error al registrar el pago:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo registrar el pago. Intente más tarde.',
                });
            });
    };

    const handleCancelarCompra = (id_ticket) => {
        Swal.fire({
            title: "Desea Eliminar su ticket generado?",
            text: "Realmente desea eliminarlo?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si, eliminarlo"
        }).then((result) => {
            if (result.isConfirmed) {
                Axios.delete(`http://localhost:3001/cancelar/${id_ticket}`)
                    .then(() => {
                        Swal.fire({
                            title: "Eliminado",
                            text: "Compra cancelada",
                            icon: "success",
                            timer: 2000
                        });
                        setFormValues({
                            id_inventario: 1,
                            cantidad_A: 0,
                            cantidad_B: 0,
                            cantidad_C: 0,
                            estado: '',
                            nombre_artista: ''
                        });
                        setShowPagoDetails(false);
                        setTotalCompra(null);
                        setTicketId(null);
                        setTicketDetails(null);
                    })
                    .catch((error) => {
                        console.error("Error al eliminar el ticket:", error);
                        Swal.fire({
                            title: "Error",
                            text: "No se pudo cancelar la compra. Intente más tarde.",
                            icon: "error",
                        });
                    });
            }
        });
    };

    return (
        <div className="MainApp">
            {isAuthenticated ? (
                <div>
 <header className="App-header navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: '#7573F5' }}>
                <div className="container d-flex justify-content-between align-items-center">
                    <div>
                        <img src={logo} alt="Not young Now" className="logo img-fluid" style={{ maxWidth: '100px', maxHeight: 'auto' }} />
                    </div>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <nav className="menu">
                            <ul className="navbar-nav ml-auto">
                                <li className="nav-item">
                                    <a className="nav-link" href="#">Evento</a>
                                </li>
                                <li className="nav-item">
                                    <a className="nav-link" href="#">Servicios adicionales</a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    <div>
                        <img src={logo} alt="Not young Now" className="logo img-fluid" style={{ maxWidth: '100px', maxHeight: 'auto' }} />
                    </div>
                </div>
            </header>

            <div className="container mt-4">
                <div className="card">
                    <div className="card-header">
                        <h2>Detalles de Eventos</h2>
                    </div>
                    <div className="card-body">
                        {detallesEventos.map((detalle) => (
                            <div key={detalle.id_detalle} className="detalle-evento">
                                <p><strong>Artista:</strong> {detalle.nombre_artista}</p>
                                <p><strong>Fecha:</strong> {detalle.fecha}</p>
                                <p><strong>Lugar:</strong> {detalle.lugar}</p>
                                <p><strong>Precio Campo A:</strong> S/ {detalle.Precio_A}</p>
                                <p><strong>Precio Campo B:</strong> S/ {detalle.Precio_B}</p>
                                <p><strong>Precio Campo C:</strong> S/ {detalle.Precio_C}</p>

                            </div>
                        ))}
                    </div>
                </div>

                <div className="card mt-4">
                    <div className="card-header">
                        <h2>Registro de Ticket</h2>
                    </div>
                    <div className="card-body">
                        {!showPagoDetails ? (
                            <form onSubmit={handleSubmit}>
  
                                <div className="form-group">
                                    <label htmlFor="cantidad_A">Cantidad Campo A:</label>
                                    <input type="number" className="form-control" id="cantidad_A" name="cantidad_A" value={formValues.cantidad_A} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cantidad_B">Cantidad Campo B:</label>
                                    <input type="number" className="form-control" id="cantidad_B" name="cantidad_B" value={formValues.cantidad_B} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cantidad_C">Cantidad Campo C:</label>
                                    <input type="number" className="form-control" id="cantidad_C" name="cantidad_C" value={formValues.cantidad_C} onChange={handleInputChange} />
                                </div><br/>
                                <button type="submit" className="btn btn-primary">Registrar Ticket</button>
                            </form>
                        ) : (
                            <div>
                                <h3>Detalles del Ticket</h3>
                                <div >
                                    {detallesEventos.map((detalle)=>(
                                    <div key={detalle.id_detalle} className='detalle-evento'>
                                    <p><strong>Nombre del Artista:</strong> {detalle.nombre_artista}</p>

                                    </div>)) }
                                </div>                                <p><strong>Cantidad Campo A:</strong> {ticketDetails.cantidad_A}</p>
                                <p><strong>Cantidad Campo B:</strong> {ticketDetails.cantidad_B}</p>
                                <p><strong>Cantidad Campo C:</strong> {ticketDetails.cantidad_C}</p>
                                <p><strong>Estado:</strong> {ticketDetails.estado}</p>
                                <p><strong>Total de Compra:</strong> S/ {totalCompra}</p>
                                <button className="btn btn-success" onClick={handleConfirmCompra}>Confirmar Compra</button>
                                <button className="btn btn-danger mr-2" onClick={() => handleCancelarCompra(ticketId)}>Cancelar Ticket</button>

                            </div>
                        )}
                    </div>
                </div>
            </div><br/><br/><br/>
            <footer className="footer" style={{ backgroundColor: '#7573F5', color: '#fff', position: 'fixed', bottom: '0', width: '100%' }}>
                <div className="container">
                    <div className="row">
                        <div className="col-md-4">
                            <h3>Sección 1</h3>
                            <p>Contenido de la sección 1.</p>
                        </div>
                        <div className="col-md-4">
                            <h3>Sección 2</h3>
                            <p>Contenido de la sección 2.</p>
                        </div>
                        <div className="col-md-4">
                            <h3>Sección 3</h3>
                            <p>Contenido de la sección 3.</p>
                        </div>
                    </div>
                </div>
            </footer>
                </div>
            ) : (
                <Login setIsAuthenticated={setIsAuthenticated} />
            )}
        </div>
    );
}

export default MainApp;