const asyncHandler = (requestHandler) => {
    return (req, res, next = () => {}) => {
        return Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            if (typeof next === 'function') {
                return next(err);
            }
            throw err;
        });
    }
}

export default asyncHandler;