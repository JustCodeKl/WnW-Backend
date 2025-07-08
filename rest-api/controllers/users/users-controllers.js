const User = require("../../models/User");

const getAllUsers = async (req, res) => {
  const users = await User.find();

  return res.json({
    success: true,
    users: users,
  });
};

module.exports = getAllUsers;
