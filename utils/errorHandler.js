const errorHandler = (controller) => {
  return async function (req, res, next) {
        try {
            await controller(req, res, next);
        } catch (err) {
            console.log("Controller error :", err)
            res.json({result : false, errorText: "Problème de connexion, merci de réessayer ultérieurement.", err})
        }
    }
}

module.exports = { errorHandler };