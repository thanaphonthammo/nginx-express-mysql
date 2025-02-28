const mysql = require("mysql2/promise");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" })); // ✅ อนุญาตทุก Origin

async function createDBConnection(retries = 5, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`⏳ Connecting to MySQL (Attempt ${i + 1}/${retries})...`);
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || "db",
                user: process.env.DB_USER || "user",
                password: process.env.DB_PASSWORD || "password",
                database: process.env.DB_NAME || "mydb",
                port: 3306
            });
            console.log("✅ MySQL Connected!");
            return connection;
        } catch (err) {
            console.error(`❌ MySQL Connection Failed (Try ${i + 1}/${retries}):`, err);
            if (i < retries - 1) {
                console.log(`🔄 Retrying in ${delay / 1000} seconds...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error("❌ MySQL Connection Failed after all retries.");
                process.exit(1);
            }
        }
    }
}

let db;
(async () => {
    db = await createDBConnection();
})();

// ✅ API ดึงข้อมูล users
app.get("/users", async (req, res) => {
    try {
        if (!db) db = await createDBConnection();
        const [results] = await db.execute("SELECT * FROM users");
        res.json(results);
    } catch (err) {
        console.error("❌ Query Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ API เพิ่ม user
app.post("/users", async (req, res) => {
    try {
        if (!db) db = await createDBConnection();
        const { name, email } = req.body;
        const [results] = await db.execute("INSERT INTO users (name, email) VALUES (?, ?)", [name, email]);
        res.json({ message: "User added!", id: results.insertId });
    } catch (err) {
        console.error("❌ Insert Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ✅ รันเซิร์ฟเวอร์
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
