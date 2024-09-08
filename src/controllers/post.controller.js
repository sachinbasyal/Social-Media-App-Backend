import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";

const createPost = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { description, image } = req.body;
    if (!description) {
      return res
        .status(401)
        .json({ success: false, message: "Please provide a description" });
    }

    const post = await Post.create({
      userId,
      description,
      image,
    });

    res.status(200).json({
      success: true,
      data: post,
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error in CreatePost::", error);
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const { userId } = req.body.user;
    const { search } = req.body;

    const user = await User.findById(userId);
    const friends = user?.friends?.toString().split(",") ?? [];
    friends.push(userId);

    const searchPostQuery = {
      $or: [
        {
          description: { $regex: search, $options: "i" },
        },
      ],
    };

    const posts = await Post.find(search ? searchPostQuery : {})
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

      const friendsPosts = posts?.filter((post)=>{
        return friends.includes(post?.userId?._id.toString())
      })

      const otherPosts = posts?.filter((post)=>!friends.includes(post?.userId?._id.toString()))

      let postsRes = null;
      
      if(friendsPosts?.length >0) {
        postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts]
      }
      else {postsRes = posts}

      res.status(200).json({
        success:true,
        data: postsRes,
        message: "Posts fetched successfully"
      })
  } catch (error) {
    console.error("Error in getPosts::", error);
    res.status(500).json({ message: error.message });
  }
};

const getPost = async (req, res) =>{
  try {
    const {id} = req.params;

    const post = await Post.findById(id).populate({
      path: "userId",
      select: "firstName lastName location profileUrl -password"
    })

    res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: post
    })
    
  } catch (error) {
    console.error("Error in getPost::", error);
    res.status(500).json({ message: error.message });
  }
}

const getUserPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.find({ userId: id })
      .populate({
        path: "userId",
        select: "firstName lastName location profileUrl -password",
      })
      .sort({ _id: -1 });

    res.status(200).json({
      sucess: true,
      message: "successfully",
      data: post,
    });
  } catch (error) {
    console.error("Error in getUserPost::", error);
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deletePost::", error);
    res.status(500).json({ message: error.message });
  }
};

export { createPost, getPosts, getPost, getUserPost,deletePost };
