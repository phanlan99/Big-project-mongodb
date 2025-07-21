/*
  id string pk
  owner ObjectId users
  content string
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const tweeterSchema = new Schema(
    {
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
tweeterSchema.plugin(mongooseAggregatePaginate)

export const Tweeter = mongoose.model("Tweeter", tweeterSchema)