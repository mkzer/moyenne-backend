const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connexion MongoDB réussie"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Routes publiques
const utilisateurRoutes = require("./routes/utilisateurs");
const noteRoutes = require("./routes/notes");
app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/notes", noteRoutes);

// Middleware d’authentification et d’autorisation
const authMiddleware = require("./middleware/auth");
const adminMiddleware = require("./middleware/admin");

// Routes admin (protégées)
const adminRoutes = require("./routes/admin");
app.use("/api/admin", authMiddleware, adminMiddleware, adminRoutes);

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
// server.js (extrait)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const UE = require("./models/UE");         // <— notre nouveau modèle
const commun = [ /* … ta liste d’UE communes … */];
const parcoursNotes = { /* … ta liste par parcours … */ };

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ Connexion MongoDB réussie");

        // ——— 1.2 Seed initial des UE si collection vide ———
        const count = await UE.countDocuments();
        if (count === 0) {
            // fusionner commun + toutes les UE de tous parcours
            const toutesUes = [
                ...commun,
                ...[].concat(...Object.values(parcoursNotes))
            ]
            // préparer en documents Mongoose
            const docs = toutesUes.map(u => ({
                code: u.code,
                nom: u.nom,
                coefficient: u.coefficient
            }));
            await UE.insertMany(docs);
            console.log(`Seed : ${docs.length} UE insérées en base.`);
        }
    })
    .catch((err) => console.error("❌ Erreur MongoDB :", err));

// … tes routes, etc.

app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
