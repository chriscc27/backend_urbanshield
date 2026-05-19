const { verifyAccessToken } = require('../utils/jwt');
const userRepository = require('../repositories/user.repository');
const { UnauthorizedError, NotFoundError } = require('../errors/AppError');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await userRepository.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new NotFoundError('User not found or inactive');
    }

    req.user = {
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
};
