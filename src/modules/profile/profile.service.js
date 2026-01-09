import prisma from "../../config/database.config.js";

/* -------------------- GET PROFILE -------------------- */
export const getProfileService = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      emailVerifiedAt: true,
      twoFactorEnabledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new Error("Utilisateur introuvable");
  return user;
};

/* -------------------- UPDATE PROFILE -------------------- */
export const updateProfileService = async (userId, data) => {
  const allowedFields = {
    firstName: data.firstName,
    lastName: data.lastName,
  };

  return prisma.user.update({
    where: { id: userId },
    data: allowedFields,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      updatedAt: true,
    },
  });
};

/* -------------------- DELETE ACCOUNT -------------------- */
export const deleteAccountService = async (userId) => {
  await prisma.user.delete({
    where: { id: userId },
  });

  return true;
};
