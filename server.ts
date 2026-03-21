import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

import axios from "axios";

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

  CREATE TABLE IF NOT EXISTS whatsapp_users (
    phone_number TEXT PRIMARY KEY,
    status TEXT DEFAULT 'active',
    last_metadata TEXT, -- JSON string with { breed, age, sex }
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
  app.use(express.urlencoded({ extended: true }));

  // WhatsApp API Routes
  
  // Register/Update Phone
  app.post("/api/whatsapp/register", (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: "Phone number is required" });
    
    try {
      const stmt = db.prepare("INSERT OR REPLACE INTO whatsapp_users (phone_number, status) VALUES (?, 'active')");
      stmt.run(phone_number);
      res.json({ message: "WhatsApp registration successful" });
    } catch (error) {
      res.status(500).json({ error: "Failed to register WhatsApp" });
    }
  });

  // Get Status
  app.get("/api/whatsapp/status/:phone", (req, res) => {
    try {
      const row = db.prepare("SELECT * FROM whatsapp_users WHERE phone_number = ?").get(req.params.phone);
      res.json(row || { status: 'not_registered' });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch WhatsApp status" });
    }
  });

  // Webhook for WhatsApp (Generic/Twilio style)
  app.post("/api/whatsapp/webhook", async (req, res) => {
    const { From, Body, MediaUrl0, MediaContentType0 } = req.body;
    const phone = From ? From.replace('whatsapp:', '') : null;

    if (!phone) return res.status(200).send("OK");

    try {
      const user = db.prepare("SELECT * FROM whatsapp_users WHERE phone_number = ?").get(phone) as any;
      
      if (!user) {
        return res.status(200).send("User not registered");
      }

      // Handle Text (Metadata)
      if (Body && !MediaUrl0) {
        const text = Body.toLowerCase();
        let metadata = user.last_metadata ? JSON.parse(user.last_metadata) : {};

        if (text.includes('raça:') || text.includes('raca:')) {
          metadata.breed = text.split(/raça:|raca:/)[1].trim();
        }
        if (text.includes('idade:')) {
          metadata.age = text.split('idade:')[1].trim();
        }
        if (text.includes('sexo:')) {
          metadata.sex = text.split('sexo:')[1].trim();
        }

        db.prepare("UPDATE whatsapp_users SET last_metadata = ? WHERE phone_number = ?")
          .run(JSON.stringify(metadata), phone);
      }

      // Handle Image (Analysis)
      if (MediaUrl0 && MediaContentType0?.startsWith('image/')) {
        console.log(`Received image from ${phone}: ${MediaUrl0}`);
        const id = `wa-${Date.now()}`;
        const metadata = user.last_metadata ? JSON.parse(user.last_metadata) : {};
        
        try {
          // Fetch image and convert to base64
          const response = await axios.get(MediaUrl0, { responseType: 'arraybuffer' });
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          const imageData = `data:${MediaContentType0};base64,${base64}`;

          db.prepare(`
            INSERT INTO analyses (id, raca, sexo, idade_estimada, image_data, descricao_detalhada)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(id, metadata.breed || 'Pendente', metadata.sex || 'Pendente', metadata.age || 'Pendente', imageData, "Enviado via WhatsApp");
        } catch (imgError) {
          console.error("Error fetching image from WhatsApp:", imgError);
          // Fallback to URL if fetch fails
          db.prepare(`
            INSERT INTO analyses (id, raca, sexo, idade_estimada, image_data, descricao_detalhada)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(id, metadata.breed || 'Pendente', metadata.sex || 'Pendente', metadata.age || 'Pendente', MediaUrl0, "Enviado via WhatsApp (URL)");
        }
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("WhatsApp Webhook Error:", error);
      res.status(200).send("Error but OK");
    }
  });

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
    const { 
      raca, confianca_raca, peso_estimado, precisao_peso, 
      cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
      score_corporal, porte, descricao_detalhada, 
      observacoes_especialista, saude_geral, lista_de_bovinos, image_data 
    } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE analyses SET 
          raca = COALESCE(?, raca),
          confianca_raca = COALESCE(?, confianca_raca),
          peso_estimado = COALESCE(?, peso_estimado),
          precisao_peso = COALESCE(?, precisao_peso),
          cor_pelagem = COALESCE(?, cor_pelagem),
          padrao_pelagem = COALESCE(?, padrao_pelagem),
          sexo = COALESCE(?, sexo),
          idade_estimada = COALESCE(?, idade_estimada),
          score_corporal = COALESCE(?, score_corporal),
          porte = COALESCE(?, porte),
          descricao_detalhada = COALESCE(?, descricao_detalhada),
          observacoes_especialista = COALESCE(?, observacoes_especialista),
          saude_geral = COALESCE(?, saude_geral),
          lista_de_bovinos = COALESCE(?, lista_de_bovinos),
          image_data = COALESCE(?, image_data)
        WHERE id = ?
      `);
      const result = stmt.run(
        raca, confianca_raca, peso_estimado, precisao_peso, 
        cor_pelagem, padrao_pelagem, sexo, idade_estimada, 
        score_corporal, porte, descricao_detalhada, 
        observacoes_especialista ? JSON.stringify(observacoes_especialista) : null, 
        saude_geral, 
        lista_de_bovinos ? JSON.stringify(lista_de_bovinos) : null, 
        image_data,
        req.params.id
      );
      if (result.changes > 0) {
        res.json({ message: "Analysis updated successfully" });
      } else {
        res.status(404).json({ error: "Analysis not found" });
      }
    } catch (error) {
      console.error("Update Error:", error);
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
