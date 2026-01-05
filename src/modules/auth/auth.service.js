import bcrypt from "bcrypt";
import prisma from "../../config/database.config.js";

export const registerService = async ({ email, password, firstName, lastName }) => {
  const exists = await prisma.user.findUnique({
    where: { email },
  });

  if (exists) {
    throw new Error("Email déjà utilisé");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  return user;
};

export const loginService = async ({ email, password }, meta = {}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Email incorrect
  if (!user) {
    await prisma.loginHistory.create({
      data: {
        email,
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  // Compte désactivé
  if (user.disabledAt) {
    throw new Error("Compte désactivé");
  }

  const passwordOk = await bcrypt.compare(password, user.password);

  // Mot de passe incorrect
  if (!passwordOk) {
    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        email,
        success: false,
        ipAddress: meta.ip,
        userAgent: meta.userAgent,
      },
    });
    throw new Error("Email ou mot de passe incorrect");
  }

  // Succès
  await prisma.loginHistory.create({
    data: {
      userId: user.id,
      email,
      success: true,
      ipAddress: meta.ip,
      userAgent: meta.userAgent,
    },
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
};

