import { asyncHandler } from "../utils/asyncHandle.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudynary, deleteFromCloudynary } from "../utils/cloudynary.js"
import { ApiResponse } from "../utils/ApiRespon.js";
import { log } from "console";
import jwr from "jsonwebtoken"
import { channel, subscribe } from "diagnostics_channel";
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "có lỗi gì đã xảy ra trong khi tạo accesstoken và refrestoken")
    }
}


const registerUser = asyncHandler(async (req, res) => {
    //TODO
    const { fullname, email, username, password } = req.body


    //validation
    if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }


    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    }) //1

    if (existedUser) {
        throw new ApiError(409, "User name or email already exists")

    }

    //xử lý ảnh 
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missting")

    }

    // const avatar = await uploadOnCloudynary(avatarLocalPath)
    // let coverImage = ""

    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudynary(coverLocalPath);
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudynary(avatarLocalPath)
        console.log("Upploaded Avatar", avatar);


    } catch (error) {
        console.log("Error upload Avatar ", error);
        throw new ApiError(500, "Failed to upload Avatar")
    }

    let coverImage = { url: "" };
    if (coverLocalPath) {
        try {
            coverImage = await uploadOnCloudynary(coverLocalPath);
            console.log("Uploaded Cover Image", coverImage);
        } catch (error) {
            console.log("Error uploading Cover Image", error);
            throw new ApiError(500, "Failed to upload Cover Image");
        }
    }




    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()

        })

        const createUser = await User.findById(user._id).select("-password -refreshToken") //Bạn không thể vừa loại trừ (-password) và vừa bao gồm (refreshToken) trong cùng .select().


        if (!createUser) {
            throw new ApiError(500, "Something went wrong while registering a user")
        }

        return res
            .status(201)
            .json(new ApiResponse(200, createUser, " User registered successfully"))

    } catch (error) {
        console.log("Người dùng không được tạo", error);
        if (avatar) {
            await deleteFromCloudynary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudynary(coverImage.public_id)
        }
        throw new ApiError(500, "Có lỗi gì đó khi đăng ký người dùng và ảnh đã bị xoá")

    }

})

const loginUser = asyncHandler(async (req, res) => {
    // lấy data từ body
    const { email, username, password } = req.body

    //validation : Xác thực
    if (!email) {
        throw new ApiError(400, "Email luôn bắt buộc")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    }) // lấy từ registerUser để check xem

    if (!user) {
        throw new ApiError(400, "Không tìm thấy người dùng")
    }

    // Xác thực mật khẩu
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Thông tin đăng nhập không hợp lệ")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            "Đăng nhập thành công"
        ))
})

const logoutUser = asyncHandler(async (req , res) => {
    await User.findByIdAndUpdate(
        //Todo : Cần quay lại đây sau khi middleware được xử lý
        req.user._id,
        {
            $set : {
                refreshToken : null,

            }
        },
        {new : true}
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
            .status(200)
            .clearCookie("accessToken" , options)
            .clearCookie("refreshToken" , options)
            .json( new ApiResponse(200 , {} ,  "Đã đăng xuất thành công"))
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const inCommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!inCommingRefreshToken) {
        throw new ApiError(401, "Refresh Token là bắt buộc");
    }

    try {
        const decodedToken = jwt.verify(
            inCommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user || inCommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token không hợp lệ");
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production"
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                "Access Token refresh thành công"
            ));

    } catch (error) {
        throw new ApiError(500, "Có lỗi gì đó trong quá trình refreshing access token");
    }
});

const changeCurrentPassword = asyncHandler(async (req , res ) => {
    // yêu cầu mật khẩu cũ và mật khẩu mới
    const {oldPassword , newPassword} = req.body
    // chỉ ra user cần thay đổi mật khẩu
    const user = await User.findById(req.user?._id)
    // Chỉ ra mật khẩu hợp lệ hay không
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    //validation
    if(!isPasswordValid){
        throw new ApiError(401 , "mật khẩu cũ không chính xác")
    }
    user.password = newPassword

    await user.save({validateBeforeSave : false})

    return res
            .status(200)
            .json( new ApiResponse(200 , {} , "Đã thay đổi mật khẩu"))

})


const getCurrentUser = asyncHandler(async (req , res) => {
    return res  
            .status(200)
            .json( new ApiResponse(200 , req.user , "Thông tin User hiện tại"))
})

const updateAcountdetails = asyncHandler(async (req , res) => {
    const {fullname , email} = req.body

    if(!fullname || !email){
        throw new ApiError(400 , "Fullname và email là bắt buộc")
    }

    const user = await User.findByIdAndUpdate(
        req.user?.id,
        {
            $set : {
                fullname,
                email : email
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(new ApiResponse(200 , user , "Tài khoản chi tiết đã được cập nhật thành công"))
})

const updateUserAvatar = asyncHandler(async (req , res) => {
    const avatarLocalPath  = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "File là bắt buộc")
    }

    const avatar = await uploadOnCloudynary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500 , "Có chuyện gì đó xảy ra trong khi upload avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(new ApiResponse(200 , user , "Avatar update thành công"))
})

const updateUserCoverImage = asyncHandler(async (req , res) => {
    const coverImagePath  = req.file?.path

    if(!coverImagePath){
        throw new ApiError(400 , "File là bắt buộc")
    }

    const coverImage = await uploadOnCloudynary(coverImagePath)

    if(!coverImage.url){
        throw new ApiError(500 , "Có chuyện gì đó xảy ra trong khi upload avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
            .status(200)
            .json(new ApiResponse(200 , user , "CoverImage update thành công"))
})


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username là bắt buộc");
    }

    // Lấy ID của người dùng đang xem trang (có thể là chính họ hoặc người khác)
    // Cần kiểm tra req.user tồn tại trước khi dùng
    const viewerId = req.user ? new mongoose.Types.ObjectId(req.user._id) : null;

    const channel = await User.aggregate([
        // --- Giai đoạn 1: Tìm kênh (user) theo username ---
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        // --- Giai đoạn 2: Lấy danh sách người đã đăng ký kênh này ---
        {
            $lookup: {
                from: "subscriptions", // Tên collection trong MongoDB
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // --- Giai đoạn 3: Lấy danh sách các kênh mà kênh này đã đăng ký ---
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        // --- Giai đoạn 4: Thêm các trường dữ liệu được tính toán ---
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    // Nếu không có người xem (chưa đăng nhập), isSubscribed luôn là false
                    $cond: {
                        if: { $and: [
                            { $ne: [viewerId, null] }, // Đảm bảo viewerId tồn tại
                            { $in: [viewerId, "$subscribers.subscriber"] }
                        ]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // --- Giai đoạn 5: Định hình lại cấu trúc output cuối cùng ---
        {
            $project: {
                fullname: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
                // Các mảng lớn như 'subscribers' và 'subscribedTo' không cần trả về nữa
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Kênh không tồn tại");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Đã lấy được dữ liệu channel thành công"));
});


const getWatchHistory = asyncHandler(async (req, res) => {
    // Sử dụng Aggregation Pipeline để thực hiện các truy vấn phức tạp trên CSDL.
    // Kết quả sẽ được gán vào biến user.
    const user = await User.aggregate([

        // --- Giai đoạn 1: TÌM chính xác người dùng đang yêu cầu ---
        {
            // $match: Lọc các document, chỉ giữ lại những document thỏa mãn điều kiện.
            $match: {
                // Tìm user có _id khớp với ID của người dùng đã đăng nhập.
                // req.user._id được lấy từ middleware xác thực đã chạy trước đó.
                // new mongoose.Types.ObjectId: Đảm bảo so sánh đúng kiểu dữ liệu (ObjectId vs String).
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },

        // --- Giai đoạn 2: LẤY thông tin chi tiết của các video đã xem ---
        {
            // $lookup: Join (kết nối) với một collection khác để lấy dữ liệu liên quan.
            $lookup: {
                from: "videos",                  // Join với collection 'videos'.
                localField: "watchHistory",      // Lấy mảng ID video từ trường 'watchHistory' của User.
                foreignField: "_id",             // So khớp với trường '_id' trong collection 'videos'.
                as: "watchHistory",              // Đặt tên cho mảng kết quả là 'watchHistory'.
                                                 // Mảng này sẽ chứa đầy đủ thông tin của các video đã xem.

                // --- PIPELINE CON: Xử lý trên TỪNG video được join vào ---
                // Pipeline này sẽ chạy cho mỗi video trong mảng watchHistory.
                pipeline: [
                    // --- Giai đoạn 2.1: LẤY thông tin chủ sở hữu của video ---
                    {
                        $lookup: {
                            from: "users",            // Join tiếp với collection 'users' để tìm chủ sở hữu.
                            localField: "owner",      // Lấy ID từ trường 'owner' của video.
                            foreignField: "_id",      // So khớp với trường '_id' trong collection 'users'.
                            as: "owner",              // Đặt tên cho mảng kết quả là 'owner'.

                            // --- PIPELINE CON (lồng sâu): Chỉ lấy các trường cần thiết của chủ sở hữu ---
                            pipeline: [
                                {
                                    // $project: Chỉ định các trường muốn giữ lại.
                                    $project: {
                                        fullname: 1,  // Lấy fullname (1 có nghĩa là lấy).
                                        username: 1,  // Lấy username.
                                        avatar: 1     // Lấy avatar.
                                    }
                                }
                            ]
                        }
                    },
                    
                    // --- Giai đoạn 2.2: "Giải nén" mảng chủ sở hữu ---
                    {
                        // $addFields: Thêm hoặc ghi đè trường.
                        $addFields: {
                            // $lookup luôn trả về một mảng, kể cả khi chỉ có 1 kết quả (vd: owner: [{...}]).
                            // $first: Lấy phần tử đầu tiên của một mảng.
                            // Ghi đè trường 'owner' (đang là mảng) bằng chính object đầu tiên bên trong nó.
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        }
    ]);

    // Aggregation luôn trả về một mảng kết quả.
    // Vì ta tìm theo _id duy nhất, kết quả sẽ là một mảng có đúng 1 phần tử ở vị trí [0].
    // Ta lấy ra lịch sử xem phim từ phần tử đó.
    const finalWatchHistory = user[0]?.watchHistory;

    return res
        .status(200)
        .json(new ApiResponse(200, finalWatchHistory, "Lịch sử lượt xem đã được lấy thành công"));
});

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAcountdetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}