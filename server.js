const express = require("express");
const Database = require("better-sqlite3");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const db = new Database("leads.db");

db.exec(`
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT,
  phone TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  mileage TEXT,
  condition TEXT,
  title_status TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

const insertLead = db.prepare(`
INSERT INTO leads (
  full_name, phone, year, make, model,
  mileage, condition, title_status,
  address, city, state, zipcode, notes
)
VALUES (
  @full_name, @phone, @year, @make, @model,
  @mileage, @condition, @title_status,
  @address, @city, @state, @zipcode, @notes
)
`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailAlert(lead) {
  const message = `
New Junk Car Lead

Name: ${lead.full_name}
Phone: ${lead.phone}
Vehicle: ${lead.year} ${lead.make} ${lead.model}
ZIP: ${lead.zipcode}
`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: "New Junk Car Lead 🚗",
    text: message
  });
}

app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sell Your Junk Car</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #111827, #1d4ed8);
        color: white;
      }

      .container {
        max-width: 700px;
        margin: auto;
        padding: 20px;
      }

      .card {
        background: white;
        color: black;
        padding: 25px;
        border-radius: 15px;
        margin-top: 20px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }

      h1 {
        text-align: center;
      }

      form {
        display: grid;
        gap: 12px;
      }

      input, select, textarea {
        padding: 14px;
        border-radius: 10px;
        border: 1px solid #ccc;
        font-size: 16px;
        width: 100%;
      }

      button {
        padding: 15px;
        background: #16a34a;
        color: white;
        border: none;
        font-size: 18px;
        font-weight: bold;
        border-radius: 10px;
        cursor: pointer;
      }

      button:hover {
        opacity: 0.9;
      }

      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      @media (max-width: 600px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>

  <body>
    <div class="container">
      <h1>💰 Get Cash For Your Junk Car</h1>

      <div class="card">
        <form method="POST" action="/lead">

          <input name="full_name" placeholder="Full Name" required />
          <input name="phone" placeholder="Phone Number" required />

          <div class="row">
            <input name="year" placeholder="Year" required />
            <input name="make" placeholder="Make" required />
          </div>

          <input name="model" placeholder="Model" required />

          <input name="mileage" placeholder="Mileage (optional)" />

          <select name="condition" required>
            <option value="">Vehicle Condition</option>
            <option>Running</option>
            <option>Not Running</option>
            <option>Wrecked</option>
            <option>Junk</option>
          </select>

          <select name="title_status" required>
            <option value="">Title Status</option>
            <option>Clean Title</option>
            <option>No Title</option>
            <option>Lien</option>
          </select>

          <h3>📍 Vehicle Location</h3>

          <input name="address" placeholder="Street Address" required />

          <div class="row">
            <input name="city" placeholder="City" required />
            <input name="state" value="GA" />
          </div>

          <input name="zipcode" placeholder="ZIP Code" required />

          <textarea name="notes" placeholder="Extra details (damage, missing parts, etc)"></textarea>

          <button type="submit">Get My Cash Offer</button>

        </form>
      </div>
    </div>
  </body>
  </html>
  `);
});

app.post("/lead", async (req, res) => {
  const lead = req.body;

  insertLead.run(lead);

  try {
    await sendEmailAlert(lead);
    console.log("✅ Email sent");
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }

  res.send('<h1>Lead saved</h1><a href="/">Back</a>');
});

app.listen(PORT, () => {
  console.log("Server running on http://localhost:3000");
});
