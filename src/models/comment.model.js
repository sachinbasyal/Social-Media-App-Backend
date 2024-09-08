import { Schema, model } from "mongoose";

const commentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    comment: { type: String, required: true },
    from: { type: String, required: true },
    likes: [{ type: String }],

    replies: [
      {
        rid: { type: Schema.Types.ObjectId },
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        from: String,
        replyAt: String,
        comment: String,
        created_At: { type: Date, default: Date.now() },
        updated_At: { type: Date, default: Date.now() },
        likes: [{ type: String }],
      },
    ],
  },
  { timestamps: true }
);

export const Comment = model("Comment", commentSchema);
