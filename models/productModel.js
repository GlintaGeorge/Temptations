const mongoose = require('mongoose');

var ProductSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, 
    },
    description: {
        type: String,
        required: true,
        
    },
    productPrice: { 
        type: Number,
        required: true
    },
    salePrice: { 
        type: Number, 
        required: true
    },
       categoryName: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category' 
    },
    
    quantity: {
        type: Number,
        required: true
    },
    stock: {     
        type: Number,
        default: 0
    },

         images: [{ type: mongoose.Schema.Types.ObjectId, ref: "Images" }],


       ratings: [{ 
        star: Number,
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    isListed:{
        type:Boolean,
        default:true
    }
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('Product', ProductSchema);