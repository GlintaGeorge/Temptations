const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        requried: true
    },
    orderItems: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrderItem",
            required: true
        },
    ],
    shippingAddress: {
        type: String,
        required: true
    },
    
    
    state: {
        type: String,
        required: true
    },
    town: {
        type: String,
        required: true
    },
    postCode: {
        type: String,
        required: true
    },
    phone: {
        type: Number
    },
    totalPrice: {
        type: Number
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    orderedDate: {
        type: Date,
        default: Date.now()
    },
    shippedDate: {
        type: Date
    },
    deliveredDate: {
        type: Date
    }
    
    
});

module.exports = mongoose.model("Order", orderSchema);