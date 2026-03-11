export const errorHandler = (err, req, res, next) => {
    try {
        console.log(err.message || "Server Error")
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message || 'Server Error',
        }); 
    } catch (error) {
        next(error);
    }
}