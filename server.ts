import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("bovino_vision.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    raca TEXT,
    confianca_raca REAL,
    peso_estimado REAL,
    precisao_peso TEXT,
    cor_pelagem TEXT,
    padrao_pelagem TEXT,
    sexo TEXT,
    idade_estimada TEXT,
    score_corporal TEXT,
    porte TEXT,
    descricao_detalhada TEXT,
    observacoes_especialista TEXT,
    saude_geral TEXT,
    image_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // CRUD API Routes
  
  // Create
  app.post("/api/analyses", (req, res) => {
    const { 
      id, raca, confianca_raca, peso_estimado, precisao_peso, 
      cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
      score_corporal, porte, descricao_detalhada, 
      observacoes_especialista, saude_geral, image_data 
    } = req.body;

    try {
      const stmt = db.prepare(`
        INSERT INTO analyses (
          id, raca, confianca_raca, peso_estimado, precisao_peso, 
          cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
          score_corporal, porte, descricao_detalhada, 
          observacoes_especialista, saude_geral, image_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, raca, confianca_raca, peso_estimado, precisao_peso, 
        cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
        score_corporal, porte, descricao_detalhada, 
        JSON.stringify(observacoes_especialista), saude_geral, image_data
      );
      
      res.status(201).json({ message: "Analysis saved successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save analysis" });
    }
  });

  // Read All
  app.get("/api/analyses", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM analyses ORDER BY created_at DESC").all();
      const formattedRows = rows.map((row: any) => ({
        ...row,
        observacoes_especialista: JSON.parse(row.observacoes_especialista)
      }));
      res.json(formattedRows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analyses" });
    }
  });

  // Read One
  app.get("/api/analyses/:id", (req, res) => {
    try {
      const row: any = db.prepare("SELECT * FROM analyses WHERE id = ?").get(req.params.id);
      if (row) {
        row.observacoes_especialista = JSON.parse(row.observacoes_especialista);
        res.json(row);
      } else {
        res.status(404).json({ error: "Analysis not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analysis" });
    }
  });

  // Update
  app.put("/api/analyses/:id", (req, res) => {
    const { raca, peso_estimado, saude_geral } = req.body;
    try {
      const stmt = db.prepare("UPDATE analyses SET raca = ?, peso_estimado = ?, saude_geral = ? WHERE id = ?");
      const result = stmt.run(raca, peso_estimado, saude_geral, req.params.id);
      if (result.changes > 0) {
        res.json({ message: "Analysis updated successfully" });
      } else {
        res.status(404).json({ error: "Analysis not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to update analysis" });
    }
  });

  // Delete
  app.delete("/api/analyses/:id", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM analyses WHERE id = ?");
      const result = stmt.run(req.params.id);
      if (result.changes > 0) {
        res.json({ message: "Analysis deleted successfully" });
      } else {
        res.status(404).json({ error: "Analysis not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete analysis" });
    }
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
