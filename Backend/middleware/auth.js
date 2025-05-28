const jwt = require('jsonwebtoken');

const authenticate = (roles) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token topilmadi' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Ruxsat yoq' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Notogri token' });
  }
};

module.exports = authenticate;