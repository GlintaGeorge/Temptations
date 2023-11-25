const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Product = require('../models/productModel');
const crypto = require('crypto');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    salt: String,
    isBlock: {
        type: Boolean,
        default: false
    },
    token:{
        type:String,
        default:''
    },
    cart: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
    }],addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }]
    
}, { timestamps: true });


userSchema.pre('save', async function (next) {
    if (this.isNew) {
        const salt = bcrypt.genSaltSync(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    // Checking for matching password
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generatePasswordResetHash = function(){
    //create hash object, then create a sha512 hash of the user's current password 
    //and return hash
    const resetHash = crypto.createHash('sha512').update(this.password).digest('hex')
    return resetHash;
}

userSchema.methods.verifyPasswordResetHash = function(resetHash = undefined){
    //regenerate hash and check if they are equal
    return this.passwordResetHash() === resetHash;
}



const User = mongoose.model('User', userSchema);
module.exports = User;