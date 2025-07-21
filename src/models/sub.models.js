/*
  id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, // one Who is Subscribing 
            ref : "User"
        },
        channel: {
            type: Schema.Types.ObjectId, // one to whom 'subscrib' is Subscribing 
            ref : "User"
        }
    },
    { timestamps: true }
)
subSchema.plugin(mongooseAggregatePaginate)

export const Sub = mongoose.model("Sub", subSchema)