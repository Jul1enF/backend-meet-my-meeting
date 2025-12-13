const jwt = require("jsonwebtoken");
const jwtTokenKey = process.env.JWT_TOKEN_KEY;
const User = require("../models/users");

const errorResponse = {
  result: false,
  error: "Session invalide ou expirée. Merci de réessayer après vous être reconnecté.",
}

const userTokenAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const jwtToken = authorization.slice(7, authorization.length);

    const { token } = jwt.verify(jwtToken, jwtTokenKey);

    req.user = await User.findOne({ token });

    // Check that the user token has been successfuly found in the db
    if (!req.user) {
      return res.json(errorResponse);
    }

    return next();
  } catch (err) {
    console.log("User Token Auth Error :", err);
    return res.json(errorResponse);
  }
};


const adminTokenAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const jwtToken = authorization.slice(7, authorization.length);

    const { token } = jwt.verify(jwtToken, jwtTokenKey);

    req.user = await User.findOne({ token });

    // Check that the user token has been successfuly found in the db
    if (!req.user || !req.user.is_admin) {
      return res.json(errorResponse);
    }

    return next();
  } catch (err) {
    console.log("User Token Auth Error :", err);
    return res.json(errorResponse);
  }
};

module.exports = { userTokenAuth, adminTokenAuth };