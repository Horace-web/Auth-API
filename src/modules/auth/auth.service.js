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
