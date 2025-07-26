const getUserChannelProfile = asyncHandler(async (req , res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400 , "Usernam là bắt buộc")
    }

    const channel = await User.aggregate( // Nếu bạn thu thập tất cả các kênh có id người dùng của mình
        [                                 // điều đó có nghĩa bạn đang thu thập toàn bộ số lượng người dùng đăng ký của mình
            {                             // Đây chính là tất cả những người đăng ký của bạn
                $match : {
                    username : username?.toLowerCase()
                }
            },
            {
                $lookup : {
                    from : "subcriptions",  // thu thập người đăng ký tôi
                    localField : "_id",
                    foreignField : "channel",
                    as : "subscribers"
                }
            },
            {
                $lookup : {                 // Tôi muốn thu thập tất cả các kênh mà tôi đăng ký 
                    from : "subcriptions",
                    localField : "_id",
                    foreignField : "subscriber",
                    as : "subscribredTo"    // đây là tất cả kênh mà tôi đăng ký
                }
            },
            {
                $addFields : {
                    subscribersCount : {
                        $size : "$subscribers", // số lượng người đăng ký tôi
                    },
                    channelsSubscribedToCount : {
                        $size : "$subscribredTo" // số lượng kênh mà tôi đăng ký
                    },
                    isSubcribed : {  // xem thử đã đăng ký chưa
                        $cond : {    // condition : điều kiện
                            if : {$in : [req.user?_id , "$subscribers.subscriber"]}, // Điều mong đợi là người dùng này sẽ có sẵn
                            then : true,    // trong những tài liệu mà người đăng ký sẽ cung cấp cho tôi
                            else : false    // trong số những người đăng ký thì có ai có id này không
                        }                                                              
                    }                                                                   
                }
            },
            {
                        // Đưa ra các dữ liệu cần thiết cho dự án 
                        $project : {
                            fullname : 1,
                            username : 1,
                            avatar : 1, 
                            subscribersCount : 1,
                            channelsSubscribedToCount : 1,
                            isSubcribed : 1,
                            coverImage : 1,
                            email : 1,
                        }
            }
        ]
    )

    if (!channel?.length) {
        throw new ApiError(404, "Kênh không tồn tại");
    }

    return res
            .status(200)
            .json( new ApiResponse(200 , channel[0] , " Đã lấy được dữ liệu channel profile thành công "))
})

const getWatchHistory = asyncHandler( async (req , res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : { // lịch sử xem
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "WatchHistory",
                pipeline : [ // sau khi xem xong video này tôi muốn biết ai là người đăng video đó
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                },
                                {
                                    $addFields : {
                                        owner : {
                                            $first : "owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
            .status(200)
            .json(new ApiResponse(200 , user[0]?.watchHistory , "Lịch sử lượt xem đã được lấy thành công"))
})