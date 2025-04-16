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
    .connect(process.env.MONGO_URI, {
        // useNewUrlParser et useUnifiedTopology ne sont plus nécessaires avec les versions récentes
    })
    .then(() => console.log("✅ Connexion MongoDB réussie"))
    .catch((err) => console.error("❌ Erreur MongoDB :", err));

// Routes
const utilisateurRoutes = require("./routes/utilisateur.routes");
const noteRoutes = require("./routes/note.routes");

app.use("/api/utilisateurs", utilisateurRoutes);
app.use("/api/notes", noteRoutes);

// Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
