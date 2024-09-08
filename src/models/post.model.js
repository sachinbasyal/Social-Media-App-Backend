import {Schema, model} from "mongoose"

const postSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    description: {
      type:String,
      required: true
    },
    image: String,
    likes: [{type:String}],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment"
      }
    ],
  }, {timestamps:true})

  export const Post = model("Post", postSchema)