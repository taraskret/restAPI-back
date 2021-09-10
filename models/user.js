const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    status: {
        type: String,
        default: 'I am new!!!'
    },
    posts: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Post'
        }
    ]
})

module.exports = mongoose.model('User', userSchema);