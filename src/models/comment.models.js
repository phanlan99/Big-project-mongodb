/*
  id string pk
  video ObjectId videos
  owner ObjectId users
  content string
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
    {
        video: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "Video"
        },
        owner: {
            type: Schema.Types.ObjectId, //cloudynary url
            ref : "User"
        },
        content: {
            type: String, //cloudynary url
            required : true
        }
    },
    { timestamps: true }
)
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment = mongoose.model("Comment", commentSchema)