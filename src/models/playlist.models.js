/*
  id string pk
  owner ObjectId users
  videos ObjectId[] videos
  name string
  description string
  createdAt Date
  updatedAt Date
 */

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema(
    {
        name: {
            type: String, //cloudynary url
            required: true
        },
        description: {
            type: String, //cloudynary url
            required: true

        },
        videos: [
            {
                type : Schema.Types.ObjectId,
                ref : "Video"
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref : "User"
        }
    },
    { timestamps: true }
)
playlistSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model("Playlist", playlistSchema)