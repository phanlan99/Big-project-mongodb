import { asyncHandler } from "../utils/asyncHandle.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudynary, deleteFromCloudynary } from "../utils/cloudynary.js"
import { ApiResponse } from "../utils/ApiRespon.js";
import { log } from "console";

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
    })
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
        if(avatar){
            await deleteFromCloudynary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudynary(coverImage.public_id)
        }
        throw new ApiError(500, "Có lỗi gì đó khi đăng ký người dùng và ảnh đã bị xoá")

    }

})

export {
    registerUser
}