import { ApiResponse } from "../utils/ApiRespon.js";
import { asyncHandler } from "../utils/asyncHandle.js";


const healthCheck = asyncHandler(async (req , res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, "OK", "Health check passed"))
})

export {healthCheck}