require('dotenv').config(); // This loads your password from the .env file
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 1. Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err.message);
    console.log('Tip: Check your .env file and DB credentials.');
  } else {
    console.log('Connected to MySQL Database Successfully!');
  }
});


// 2. Email Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- ROUTES ---

// GET All Flights
app.get('/api/flights', (req, res) => {
    const sql = "SELECT * FROM flights";
    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(result);
    });
});

// ADD a Flight
app.post('/api/flights', (req, res) => {
    const { origin, destination, date, price, seats } = req.body;
    const sql = "INSERT INTO flights (origin, destination, date, price, seats) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [origin, destination, date, price, seats], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Flight added successfully", id: result.insertId });
    });
});

// DELETE a Flight
app.delete('/api/flights/:id', (req, res) => {
    const sql = "DELETE FROM flights WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Flight deleted" });
    });
});

// BOOK a Flight
app.post('/api/book', (req, res) => {
    const { flight_id, passenger_name, email, flight_details } = req.body;
    
    // Check seats
    const sqlCheck = "SELECT seats FROM flights WHERE id = ?";
    db.query(sqlCheck, [flight_id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0 || results[0].seats <= 0) {
            return res.status(400).json({ message: "Flight full or not found" });
        }

        // Reduce seat count
        const sqlUpdate = "UPDATE flights SET seats = seats - 1 WHERE id = ?";
        db.query(sqlUpdate, [flight_id], () => {
            
            // Save Booking
            const sqlInsert = "INSERT INTO bookings (flight_id, passenger_name, email) VALUES (?, ?, ?)";
            db.query(sqlInsert, [flight_id, passenger_name, email], (err, result) => {
                if (err) return res.status(500).json(err);

                // Send Email (Only attempts if credentials exist)
                if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                    const mailOptions = {
                        from: process.env.EMAIL_USER,
                        to: email,
                        subject: 'Flight Booking Confirmation',
                        text: `Hello ${passenger_name},\n\nYour flight from ${flight_details.origin} to ${flight_details.destination} is confirmed.\nTotal Price: $${flight_details.price}\n\nHave a safe trip!`
                    };

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) console.log('Email warning:', error.message);
                        else console.log('Email sent: ' + info.response);
                    });
                }

                res.json({ message: "Booking confirmed!" });
            });
        });
    });
});
// ... existing code ...

// 5. GET Bookings for a specific user (My Bookings)
app.get('/api/bookings/:email', (req, res) => {
    const email = req.params.email;
    // We use a JOIN query here to combine Booking info with Flight info
    const sql = `
        SELECT b.id as booking_id, b.passenger_name, b.booking_date, 
               f.origin, f.destination, f.date as flight_date, f.price 
        FROM bookings b 
        JOIN flights f ON b.flight_id = f.id 
        WHERE b.email = ?
        ORDER BY b.booking_date DESC
    `;
    db.query(sql, [email], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});