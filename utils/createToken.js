const jwt = require("jsonwebtoken");
require('dotenv').config({
  path: ['.env.local', '.env'],
  override: true,
  quiet: true
});


module.exports.createToken = async (data) => {
  const token = await jwt.sign(data, process.env.SECRET, {
    expiresIn: "1d",
  });

  return token;
};
