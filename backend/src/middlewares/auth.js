const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Require Role: ' + roles.join(', ') });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole };
