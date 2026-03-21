import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(process.cwd(), "bovino_vision.db");
const db = new Database(dbPath);

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
    lista_de_bovinos TEXT,
    image_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Sample Analyses if empty
const analysesCount = db.prepare("SELECT COUNT(*) as count FROM analyses").get() as { count: number };
if (analysesCount.count === 0) {
  const insertAnalysis = db.prepare(`
    INSERT INTO analyses (
      id, raca, confianca_raca, peso_estimado, precisao_peso, 
      cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
      score_corporal, porte, descricao_detalhada, 
      observacoes_especialista, saude_geral, lista_de_bovinos, image_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const samples = [
    [
      "sample-1", "Nelore", 0.98, 720.5, "Alta", "Branco", "Uniforme", "Macho", "36 meses", 
      "4/5", "Grande", "Animal em excelente estado de conservação.", 
      JSON.stringify(["Peso acima da média para a idade", "Pelagem brilhante"]), 
      "Saudável", JSON.stringify([]), "https://picsum.photos/seed/cow1/800/600"
    ],
    [
      "sample-2", "Angus", 0.95, 680.0, "Média", "Preto", "Uniforme", "Fêmea", "24 meses", 
      "3/5", "Médio", "Novilha com bom desenvolvimento.", 
      JSON.stringify(["Acompanhar ganho de peso"]), 
      "Saudável", JSON.stringify([]), "https://picsum.photos/seed/cow2/800/600"
    ]
  ];

  for (const sample of samples) {
    insertAnalysis.run(...sample);
  }
  console.log("Seeded sample analyses.");
}

// Migration: Add lista_de_bovinos if it doesn't exist (for existing databases)
try {
  const columns = db.prepare("PRAGMA table_info(analyses)").all();
  const hasColumn = columns.some((col: any) => col.name === 'lista_de_bovinos');
  if (!hasColumn) {
    db.exec("ALTER TABLE analyses ADD COLUMN lista_de_bovinos TEXT");
    console.log("Migration: Added lista_de_bovinos column to analyses table");
  }
} catch (error) {
  console.error("Migration error:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // CRUD API Routes
  
  // Create
  app.post("/api/analyses", (req, res) => {
    const { 
      id: rawId, raca, confianca_raca, peso_estimado, precisao_peso, 
      cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
      score_corporal, porte, descricao_detalhada, 
      observacoes_especialista, saude_geral, lista_de_bovinos, image_data 
    } = req.body;

    const id = rawId ? rawId.trim() : null;

    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO analyses (
          id, raca, confianca_raca, peso_estimado, precisao_peso, 
          cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
          score_corporal, porte, descricao_detalhada, 
          observacoes_especialista, saude_geral, lista_de_bovinos, image_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        id, raca, confianca_raca, peso_estimado, precisao_peso, 
        cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
        score_corporal, porte, descricao_detalhada, 
        JSON.stringify(observacoes_especialista || []), saude_geral, 
        JSON.stringify(lista_de_bovinos || []), image_data
      );
      
      res.status(201).json({ message: "Analysis saved successfully" });
    } catch (error) {
      console.error("Database Error (POST /api/analyses):", error);
      res.status(500).json({ 
        error: "Failed to save analysis", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Read All
  app.get("/api/analyses", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM analyses ORDER BY created_at DESC").all();
      const formattedRows = rows.map((row: any) => ({
        ...row,
        observacoes_especialista: JSON.parse(row.observacoes_especialista),
        lista_de_bovinos: row.lista_de_bovinos ? JSON.parse(row.lista_de_bovinos) : []
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
        row.lista_de_bovinos = row.lista_de_bovinos ? JSON.parse(row.lista_de_bovinos) : [];
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

  // Delete All
  app.delete("/api/analyses", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM analyses");
      stmt.run();
      res.json({ message: "All analyses deleted successfully" });
    } catch (error) {
      console.error("Error deleting all analyses:", error);
      res.status(500).json({ error: "Failed to delete all analyses" });
    }
  });

  // Delete One
  app.delete("/api/analyses/:id", (req, res) => {
    const id = req.params.id.trim();
    console.log(`Attempting to delete analysis with ID: [${id}]`);
    try {
      const stmt = db.prepare("DELETE FROM analyses WHERE id = ?");
      const result = stmt.run(id);
      if (result.changes > 0) {
        console.log(`Successfully deleted analysis: [${id}]`);
        res.json({ message: "Analysis deleted successfully" });
      } else {
        console.warn(`Analysis not found for deletion: [${id}]`);
        res.status(404).json({ error: "Analysis not found" });
      }
    } catch (error) {
      console.error(`Error deleting analysis [${id}]:`, error);
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
