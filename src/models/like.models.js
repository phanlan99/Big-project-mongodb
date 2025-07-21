/*
  id string pk
  video ObjectId videos
  comment ObjectId comments
  tweet ObjectId tweets
  likedBy ObjectId users
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const likeSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "Video"
        },
        comment: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "Comment"
        },
        tweet: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "Tweeter"
        },
        likedBy: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "User"
        }
    },
    { timestamps: true }
)
likeSchema.plugin(mongooseAggregatePaginate)

export const Like = mongoose.model("Like", likeSchema)