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

// Import des routes
const utilisateurRoutes = require("./routes/utilisateurs");
const noteRoutes = require("./routes/notes");
const adminRoutes = require("./routes/admin"); // <-- ajout des routes admin

// Montage des routes
app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/admin", adminRoutes); // <-- branchement des routes admin

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
