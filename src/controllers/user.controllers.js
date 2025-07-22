import { asyncHandler } from "../utils/asyncHandle.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudynary, deleteFromCloudynary } from "../utils/cloudynary.js"
import { ApiResponse } from "../utils/ApiRespon.js";
import { log } from "console";
import jwr from "jsonwebtoken"


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



export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser
}