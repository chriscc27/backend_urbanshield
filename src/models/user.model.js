const toPublicUser = (user) => {
  if (!user) return null;
  const {
    password,
    refreshToken,
    passwordResetToken,
    ...publicUser
  } = user;
  
  if (publicUser.trustScore === undefined) {
    publicUser.trustScore = 50;
  }
  
  return publicUser;
};

const createUserEntity = ({
  userId,
  email,
  password,
  name,
  role,
  phone = null,
  isActive = true,
  trustScore = 50,
  createdAt,
  updatedAt,
}) => ({
  userId,
  email: email.toLowerCase(),
  password,
  name,
  role,
  phone,
  isActive,
  trustScore,
  createdAt,
  updatedAt,
});

module.exports = {
  toPublicUser,
  createUserEntity,
};
