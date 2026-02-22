import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("farming.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS sensor_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    region TEXT,
    soil_moisture REAL,
    temperature REAL,
    humidity REAL
  );

  CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    planted_date DATE,
    region TEXT,
    status TEXT
  );
`);

// Seed initial data for each region if missing
const regions = ["Mogadishu", "Hargeisa", "Kismayo", "Baidoa", "Garowe", "Jowhar", "Afgooye", "Bal'ad", "Beledweyne"];
const insert = db.prepare("INSERT INTO sensor_data (region, soil_moisture, temperature, humidity) VALUES (?, ?, ?, ?)");

const regionConfigs: Record<string, { tempRange: [number, number], moistureRange: [number, number], humidityRange: [number, number] }> = {
  "Mogadishu": { tempRange: [28, 32], moistureRange: [30, 50], humidityRange: [70, 85] },
  "Hargeisa": { tempRange: [20, 28], moistureRange: [20, 40], humidityRange: [30, 50] },
  "Kismayo": { tempRange: [28, 30], moistureRange: [35, 55], humidityRange: [75, 85] },
  "Baidoa": { tempRange: [32, 34], moistureRange: [25, 45], humidityRange: [40, 60] },
  "Garowe": { tempRange: [28, 30], moistureRange: [15, 35], humidityRange: [20, 40] },
  "Jowhar": { tempRange: [33, 35], moistureRange: [40, 60], humidityRange: [50, 70] },
  "Afgooye": { tempRange: [31, 37], moistureRange: [40, 60], humidityRange: [55, 75] },
  "Bal'ad": { tempRange: [31, 37], moistureRange: [40, 60], humidityRange: [55, 75] },
  "Beledweyne": { tempRange: [33, 39], moistureRange: [35, 55], humidityRange: [45, 65] },
};

regions.forEach(region => {
  const existing = db.prepare("SELECT COUNT(*) as count FROM sensor_data WHERE region = ?").get(region) as { count: number };
  if (existing.count === 0) {
    const config = regionConfigs[region] || { tempRange: [25, 35], moistureRange: [20, 60], humidityRange: [30, 70] };
    for (let i = 0; i < 24; i++) {
      const temp = config.tempRange[0] + Math.random() * (config.tempRange[1] - config.tempRange[0]);
      const moisture = config.moistureRange[0] + Math.random() * (config.moistureRange[1] - config.moistureRange[0]);
      const humidity = config.humidityRange[0] + Math.random() * (config.humidityRange[1] - config.humidityRange[0]);
      insert.run(region, moisture, temp, humidity);
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/sensors/latest", (req, res) => {
    // Returns the latest record for every region to ensure dashboard stats are populated
    const data = db.prepare(`
      SELECT * FROM sensor_data 
      WHERE id IN (
        SELECT MAX(id) FROM sensor_data GROUP BY region
      )
    `).all();
    res.json(data);
  });

  app.get("/api/sensors/history/:region", (req, res) => {
    const { region } = req.params;
    const data = db.prepare("SELECT * FROM sensor_data WHERE region = ? ORDER BY timestamp DESC LIMIT 24").all(region);
    res.json(data);
  });

  app.get("/api/sensors/stats", (req, res) => {
    const stats = db.prepare(`
      SELECT 
        region, 
        AVG(soil_moisture) as avg_moisture, 
        AVG(temperature) as avg_temp, 
        AVG(humidity) as avg_humidity 
      FROM sensor_data 
      GROUP BY region
    `).all();
    res.json(stats);
  });

  app.post("/api/sensors/report", (req, res) => {
    const { region, soil_moisture, temperature, humidity } = req.body;
    const insert = db.prepare("INSERT INTO sensor_data (region, soil_moisture, temperature, humidity) VALUES (?, ?, ?, ?)");
    insert.run(region, soil_moisture, temperature, humidity);
    res.status(201).json({ status: "success" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
