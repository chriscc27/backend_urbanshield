const toPublicUser = (user) => {
  if (!user) return null;
  const {
    password,
    refreshToken,
    passwordResetToken,
    ...publicUser
  } = user;
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
  createdAt,
  updatedAt,
});

module.exports = {
  toPublicUser,
  createUserEntity,
};
