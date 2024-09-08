
// ERROR MIDDLEWARE | NEXT FUNCTION

const routeNotFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
    const defaultError = {
      statusCode: 500, // Default to Internal Server Error
      success:false,
      message: err,
    };
  
    // Log the error for debugging
    console.error(err);
  
    if (err?.name === "ValidationError") {
      defaultError.statusCode = 400; // Bad Request
  
      defaultError.message = Object.values(err.errors)
        .map((el) => el.message)
        .join(",");
    }

  
    // Duplicate key error
    if (err?.code && err?.code === 11000) {
      defaultError.statusCode = 409; // Conflict
      defaultError.message = `${Object.keys(err.keyPattern).join(
        ", "
      )} must be unique`;
    }
  
    res?.status(defaultError.statusCode).json({
      success: defaultError.success,
      message: defaultError.message,
    });
  };
  

export { routeNotFound, errorHandler };