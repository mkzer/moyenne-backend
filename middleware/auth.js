const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.utilisateur = decoded; // contient { id, isAdmin }
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token invalide.' });
    }
};

module.exports = auth;
