async login(phone: string, password: string) {
  try {
    console.log("[LOGIN] STEP 1 - Login request received", { phone });

    const user = await prisma.user.findUnique({
      where: { phone },
    });

    console.log("[LOGIN] STEP 2 - User lookup completed", {
      found: !!user,
      userId: user?.id,
    });

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    console.log("[LOGIN] STEP 3 - User is active check");

    if (!user.isActive) {
      throw new AppError("Account inactive", 401);
    }

    console.log("[LOGIN] STEP 4 - Lock check");

    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / (60 * 1000));

      throw new AppError(
        `Too many failed attempts. Please try again in ${remainingMin} minute${remainingMin > 1 ? "s" : ""}.`,
        401
      );
    }

    console.log("[LOGIN] STEP 5 - Before bcrypt.compare");

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash
    );

    console.log("[LOGIN] STEP 6 - Password compared", {
      valid: isPasswordValid,
    });

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedAttempts + 1;
      let lockUntil: Date | null = null;

      if (newFailedAttempts >= 15) {
        lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      } else if (newFailedAttempts >= 10) {
        lockUntil = new Date(Date.now() + 5 * 60 * 1000);
      } else if (newFailedAttempts >= 5) {
        lockUntil = new Date(Date.now() + 1 * 60 * 1000);
      }

      console.log("[LOGIN] STEP 7 - Updating failed attempts");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: newFailedAttempts,
          lastFailedAttempt: new Date(),
          lockUntil,
        },
      });

      if (lockUntil) {
        const lockMin =
          newFailedAttempts >= 15
            ? 15
            : newFailedAttempts >= 10
            ? 5
            : 1;

        throw new AppError(
          `Too many failed attempts. Please try again in ${lockMin} minute${lockMin > 1 ? "s" : ""}.`,
          401
        );
      }

      throw new AppError("Invalid credentials", 401);
    }

    console.log("[LOGIN] STEP 8 - Reset failed attempts if needed");

    if (user.failedAttempts > 0 || user.lockUntil || user.lastFailedAttempt) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedAttempts: 0,
          lastFailedAttempt: null,
          lockUntil: null,
        },
      });
    }

    console.log("[LOGIN] STEP 9 - Creating JWT");

    const token = this.createAccessToken(user);

    console.log("[LOGIN] STEP 10 - JWT created");

    console.log("[LOGIN] STEP 11 - Creating refresh token");

    const refreshToken = await this.createRefreshToken(user.id);

    console.log("[LOGIN] STEP 12 - Refresh token created");

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("[LOGIN] ERROR:", error);
    throw error;
  }
}