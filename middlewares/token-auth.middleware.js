const jwt = require("jsonwebtoken");
const jwtTokenKey = process.env.JWT_TOKEN_KEY;
const User = require("../models/users.model");

const errorResponse = {
  result: false,
  errorText: "Session invalide ou expirée. Merci de réessayer après vous être reconnecté(e).",
  sessionExpired : true,
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


const ownerTokenAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const jwtToken = authorization.slice(7, authorization.length);

    const { token } = jwt.verify(jwtToken, jwtTokenKey);

    req.user = await User.findOne({ token });

    // Check that the user token has been successfuly found in the db with the appropriate role
    if (!req.user || req.user?.role !== "owner") {
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

    // Check that the user token has been successfuly found in the db with the appropriate role
    if (!req.user || (req.user?.role !== 'owner' && req.user?.role !== 'admin' )) {
      return res.json(errorResponse);
    }

    return next();
  } catch (err) {
    console.log("User Token Auth Error :", err);
    return res.json(errorResponse);
  }
};


const employeeTokenAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const jwtToken = authorization.slice(7, authorization.length);

    const { token } = jwt.verify(jwtToken, jwtTokenKey);

    req.user = await User.findOne({ token });

    // Check that the user token has been successfuly found in the db with the appropriate role
    if (!req.user || req.user?.role === 'client') {
      return res.json(errorResponse);
    }

    return next();
  } catch (err) {
    console.log("User Token Auth Error :", err);
    return res.json(errorResponse);
  }
};

module.exports = { userTokenAuth, ownerTokenAuth, adminTokenAuth, employeeTokenAuth };