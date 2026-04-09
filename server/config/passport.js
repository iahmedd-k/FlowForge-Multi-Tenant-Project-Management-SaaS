const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');

// Google Strategy Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName || '';
        const lastName = profile.name?.familyName || '';
        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;

        // Check if user exists
        let user = await User.findOne({ email });

        if (!user) {
          // Create new user if doesn't exist
          // Create default workspace for new user
          const workspace = new Workspace({
            name: `${firstName}'s Workspace`,
            description: 'Default workspace',
            owner: null, // Will be set after user creation
          });
          await workspace.save();

          user = new User({
            email,
            firstName,
            lastName,
            avatar,
            googleId,
            isVerified: true, // Google email is verified
            workspaceId: workspace._id,
            role: 'admin',
          });

          await user.save();

          // Update workspace owner
          workspace.owner = user._id;
          await workspace.save();

          // Add user to workspace members
          new WorkspaceMember({
            workspaceId: workspace._id,
            userId: user._id,
            role: 'admin',
          }).save();
        } else {
          // Update existing user with Google ID if not already set
          if (!user.googleId) {
            user.googleId = googleId;
            user.isVerified = true;
            if (!user.avatar) user.avatar = avatar;
            await user.save();
          }
        }

        return done(null, user);
      } catch (err) {
        console.error('Google strategy error:', err);
        return done(err, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
