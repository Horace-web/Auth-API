// oauth.config.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// Configuration de sérialisation/désérialisation pour Passport
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Configuration Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // Cette fonction sera appelée après l'authentification Google
      // On retourne le profile pour que le controller puisse le traiter
      return done(null, profile);
    }
  )
);

export default passport;

