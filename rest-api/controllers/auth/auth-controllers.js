const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");

require("dotenv").config();

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "User doesn't exist! Please register",
        success: false,
      });
    }
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.json({ error: "Invalid password or Email", success: false });
    }
    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRATION, // Token expiration time
      }
    );
    // Set token in cookies
    return res
      .cookie("token", token, {
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === "production", // Use secure cookies in production
        sameSite: "none", // Helps prevent CSRF attacks
      })
      .json({
        message: "User logged in successfully",
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
        },
      });
  } catch (error) {
    res.json({ error: "Login failed" });
  }
};

module.exports = {
  login,
};