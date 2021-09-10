const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const io = require('../socket')
const Post = require('../models/post');
const User = require('../models/user')

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPege = 2;
    try {
  const totalItems = await Post.find().countDocuments();
  const posts = await Post.find()
  .skip((currentPage - 1) * perPege)
  .limit(perPege);
      res.status(200)
        .json({ 
          message: 'Fetched posts successfully.', 
          posts: posts, 
          totalItems: totalItems });
  } 
    catch(err) {
      console.log(err);
      next(err);
       }
       
 
   // .catch(err => {
    //   if (!err.statusCode) {
    //     err.statusCode = 500;
    //   }
    //   next(err);
    // });
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post)
    await user.save();
    io.getIO().emit('posts', { action: 'create', post: post})
      res.status(201).json({
        message: 'Post created successfully!!!!',
        post: post,
        creator: {
          _id: user._id,
          name: user.name
        }
      });
  } catch(err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try{
     const post = await Post.findById(postId)
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ message: 'Post fetched.', post: post });
  }
    catch(err) {
     console.log(err);
     next(err);
      }
      
    };



// exports.getPost = (req, res, next) => {
//   const postId = req.params.postId;
//   Post.findById(postId)
//     .then(post => {
//       if (!post) {
//         const error = new Error('Could not find post.');
//         error.statusCode = 404;
//         throw error;
//       }
//       res.status(200).json({ message: 'Post fetched.', post: post });
//     })
//     .catch(err => {
//       if (!err.statusCode) {
//         err.statusCode = 500;
//       }
//       next(err);
//     });
// };

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked.');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString() !== req.userId){
        const error = new Error('NotAuthorised to Edit!!');
        error.statusCode = 403;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then(result => {
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
         next(err);
      }
     
    });
};

exports.deletePost = (req,res, next)=>{
  const postId= req.params.postId;

  Post.findById(postId)
    .then(post =>{
      if (!post) {
        const error = new Error('Could not find post.');
        error.statusCode = 404;
        throw error;
      }
      if(post.creator.toString() !== req.userId){
        const error = new Error('Not Authorised to delete!!');
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    })
    .then(result =>{
       return User.findById(req.userId);
    })
    .then(user => {
      user.posts.pull(postId)
     return user.save();
    })
    .then(result =>{
      res.status(200).json({message: 'Deleted Post', })
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    })

}

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
