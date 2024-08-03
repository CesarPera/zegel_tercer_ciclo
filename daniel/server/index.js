const express = require('express');
const app = express();
const mysql = require('mysql2');
const cors = require('cors');



// Manipulacion para las peticiones http
app.use(cors());
app.use(express.json());

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '321654987Daniel.',
    database: 'nyn'
});

// Conexión a MySQL
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conectado a la base de datos MySQL');
});
app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;
    const query = 'SELECT * FROM cliente WHERE correo = ? AND contraseña = ?';
    db.query(query, [correo, contraseña], (err, results) => {
        if (err) {
            return res.status(500).send({ success: false, message: 'Error en el servidor' });
        }
        if (results.length > 0) {
            res.send({ success: true, message: 'Autenticación exitosa' });
        } else {
            res.status(401).send({ success: false, message: 'Credenciales incorrectas' });
        }
    });
});

// Ruta para obtener detalles de eventos con precios y cantidad disponible
app.get('/detalles_evento', (req, res) => {
    const sql = `
 SELECT 
    d.id_detalle, 
    d.fecha, 
    d.lugar, 
    d.patrocinadores, 
    i.artista AS nombre_artista,  -- Aseguramos que el campo artista sea el correcto
    i.Precio_A,
    i.Precio_B,
    i.Precio_C,
    i.Cantidad_A,
    i.Cantidad_B,
    i.Cantidad_C
FROM 
    detalles_evento d
INNER JOIN 
    inventario i ON d.id_inventario = i.id_inventario `;

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error al obtener detalles de evento:', err);
            res.status(500).send('Error al obtener detalles de evento');
        } else {
            res.status(200).json(result);
        }
    });
});

// Registrar un nuevo ticket
app.post('/ticket', (req, res) => {
    const { id_inventario, cantidad_A, cantidad_B, cantidad_C } = req.body;

    // Validar cantidades ingresadas
    if ((cantidad_A == null || cantidad_A <= 0) && 
        (cantidad_B == null || cantidad_B <= 0) && 
        (cantidad_C == null || cantidad_C <= 0)) {
        return res.status(400).json({ message: 'Las cantidades ingresadas no son válidas' });
    }

    // Consultar precios y cantidades disponibles en el inventario
    const sql = `
        SELECT 
            precio_a,
            precio_b,
            precio_c,
            cantidad_a,
            cantidad_b,
            cantidad_c
        FROM 
            inventario
        WHERE
            id_inventario = ?
    `;

    db.query(sql, [id_inventario], (err, results) => {
        if (err) {
            console.error('Error al obtener precios y cantidades:', err);
            return res.status(500).json({ error: 'Error al obtener precios y cantidades' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Inventario no encontrado' });
        }

        const { precio_a, precio_b, precio_c, cantidad_a, cantidad_b, cantidad_c } = results[0];

        // Validar disponibilidad en inventario
        if ((cantidad_A > 0 && cantidad_A > cantidad_a) || 
            (cantidad_B > 0 && cantidad_B > cantidad_b) || 
            (cantidad_C > 0 && cantidad_C > cantidad_c)) {
            return res.status(400).json({ message: 'No hay suficiente stock para las cantidades seleccionadas' });
        }

        // Calcular cantidad total y precio total
        const cantidad_total = (cantidad_A || 0) + (cantidad_B || 0) + (cantidad_C || 0);
        const total = (cantidad_A * precio_a || 0) + (cantidad_B * precio_b || 0) + (cantidad_C * precio_c || 0);

        // Determinar el estado del ticket
        let estado = 0; // Por defecto, estado pendiente
        if (cantidad_A > 0 || cantidad_B > 0 || cantidad_C > 0) {
            estado = 1; // Estado registrado si hay al menos una cantidad positiva
        }

        // Actualizar inventario
        const updateInventorySql = `
            UPDATE inventario 
            SET cantidad_a = cantidad_a - ?, 
                cantidad_b = cantidad_b - ?, 
                cantidad_c = cantidad_c - ? 
            WHERE id_inventario = ?
        `;

        db.query(updateInventorySql, [cantidad_A || 0, cantidad_B || 0, cantidad_C || 0, id_inventario], (err, updateResult) => {
            if (err) {
                console.error('Error al actualizar el inventario:', err);
                return res.status(500).json({ error: 'Error al actualizar el inventario' });
            }

            // Insertar ticket
            const insertTicketSql = `
                INSERT INTO ticket (id_inventario, cantidad, precio, estado)
                VALUES (?, ?, ?, ?)
            `;

            db.query(insertTicketSql, [id_inventario, cantidad_total, total, estado], (err, result) => {
                if (err) {
                    console.error('Error al insertar el ticket:', err);
                    return res.status(500).json({ error: 'Error al insertar el ticket' });
                }

                const ticketId = result.insertId;
                console.log('Ticket insertado correctamente');
                res.status(200).json({ message: 'Ticket insertado correctamente', total, ticketId });
            });
        });
    });
});

// Nueva ruta para registrar un pago
app.post('/pago', (req, res) => {
    const { id_ticket, fecha_pago, monto_total } = req.body;

    // Consultar id_inventario desde la tabla ticket
    const getInventarioIdSql = `
        SELECT id_inventario 
        FROM ticket 
        WHERE id_ticket = ?
    `;

    db.query(getInventarioIdSql, [id_ticket], (err, results) => {
        if (err) {
            console.error('Error al obtener id_inventario:', err);
            return res.status(500).json({ error: 'Error al obtener id_inventario' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }

        const id_inventario = results[0].id_inventario;

        // Insertar pago con id_inventario obtenido
        const insertPagoSql = `
            INSERT INTO pago (id_ticket, id_inventario, fecha_pago, monto_total)
            VALUES (?, ?, ?, ?)
        `;

        db.query(insertPagoSql, [id_ticket, id_inventario, fecha_pago, monto_total], (err, result) => {
            if (err) {
                console.error('Error al insertar el pago:', err);
                res.status(500).send('Error al insertar el pago');
            } else {
                const pagoId = result.insertId;
                console.log('Pago insertado correctamente');
                res.status(200).json({ message: 'Pago insertado correctamente', id_pago: pagoId });
            }
        });
    });
});

// Nueva ruta para cancelar un ticket y eliminarlo de la base de datos
app.delete('/cancelar/:id_ticket', (req, res) => {
    const id_ticket = req.params.id_ticket;
    console.log('ID Ticket a cancelar:', id_ticket); // Verifica qué valor llega aquí

    // Verifica que id_ticket sea un número válido antes de ejecutar la consulta DELETE
    if (!id_ticket || isNaN(id_ticket)) {
        return res.status(400).json({ error: 'ID de ticket inválido' });
    }

    // Eliminar el ticket de la tabla ticket
    const deleteTicketSql = `
        DELETE FROM ticket
        WHERE id_ticket = ?
    `;

    db.query(deleteTicketSql, [id_ticket], (err, result) => {
        if (err) {
            console.error('Error al cancelar el ticket:', err);
            res.status(500).json({ error: 'Error al cancelar el ticket' });
        } else {
            console.log('Ticket cancelado correctamente');
            res.status(200).json({ message: 'Ticket cancelado correctamente' });
        }
    });
});
// Puerto de escucha del servidor
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});