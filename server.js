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
