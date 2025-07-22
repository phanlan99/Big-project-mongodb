import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandle.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const authHeader = req.headers.authorization || "";
    const tokenFromHeader = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : null;
    const token = req.cookies.accessToken || tokenFromHeader;

    if (!token) {
        throw new ApiError(401, "Không thể xác thực (thiếu token)");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        if (!decodedToken?._id) {
            throw new ApiError(401, "Token không chứa ID người dùng");
        }

        const user = await User.findById(decodedToken._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Người dùng không tồn tại");
        }

        req.user = user; // Gán user đã xác thực vào req

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Access Token không hợp lệ");
    }
});
