const { validationResult } = require('express-validator/check')
const User = require('../models/user');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.signup = (req, res, next) => {
    const errors  = validationResult(req);
    if(!errors.isEmpty()){
        const error = new Error('validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    } 
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;
    bcrypt
    .hash(password, 12)
    .then(hashedPw =>{
        const user = new User({
            email: email,
            password: hashedPw,
            name: name
        })
        return user.save()
    })
    .then(result=>{
        res.status(201).json({message: 'User created Successfilly!', userId: result._id})
    })
    .catch(err=>console.log(err)) 
};

exports.login = (req, res, next)=>{
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findOne({email: email})
        .then(foundUser => {
            if(!foundUser){
                const error  = new Error('A user with this email not found');
                error.statusCode = 401;
                throw error;
            } 
            loadedUser = foundUser;
            return bcrypt.compare(password, foundUser.password);
        })
        .then(isMached => {
            if(!isMached){
                const error  = new Error('WrongPasswword');
                error.statusCode = 401;
                throw error
            }
            const token = jwt.sign({
                email: loadedUser.email,
                userId: loadedUser._id.toString()
            }, 
            'lexus',
            {expiresIn: '1h'}
        );
        res.status(200).json({token: token, userId: loadedUser._id.toString() })
        })
        .catch(err =>{
            if(!err.statusCode){
                error.statusCode = 500;
            }
            next(err)
        })     
} 

exports.getUserStatus = (req, res, next)=>{
    User.findById(req.userId)
    .then(user => {
        if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error
        }
        res.status(200).json({status: user.status})

    })
    .catch(err =>{
        if(!err.statusCode){
            error.statusCode = 500;
        }
        next(err)
    });
};

// exports.updateUserStatus = async (req, res, next)=>{
//     const newStatus = req.body.status;
//     try {
//         const user = await User.findById(req.userId)
//         if(!user){
//             const error = new Error('User not found');
//             error.statusCode = 404;
//             throw error
//         }
//         user.status = newStatus
//         res.status(200).json({message: 'user updated'})
//     } catch (err){
//         console.log(err);
//       }
//       next(err);
// }

exports.updateUserStatus = (req, res, next)=>{
    const newStatus = req.body.status;
     User.findById(req.userId)
     .then(user =>{
         if(!user){
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error
        }
        user.status = newStatus
        return user.save()
     })
     .then(result =>{
          res.status(200).json({message: 'user updated'})
     })
     .catch(err =>{
        if(!err.statusCode){
            error.statusCode = 500;
        }
        next(err);  
    })
     
}