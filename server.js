const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: __dirname + '/.env' });

// 🔁 Import des routes
const utilisateursRoutes = require('./routes/utilisateurs');
const notesRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔧 Middleware
app.use(cors());
app.use(express.json());

// ✅ Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Connexion MongoDB réussie'))
    .catch((err) => console.error('❌ Erreur MongoDB :', err));

// 🚦 Définition des routes
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/notes', notesRoutes);

// 🚀 Lancement du serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
