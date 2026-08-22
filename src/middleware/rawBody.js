const captureRawBody = (req, res, next) => {
  if (req.body && Buffer.isBuffer(req.body)) {
    req.rawBody = req.body.toString("utf8");
  }
  next();
};

module.exports = { captureRawBody };
