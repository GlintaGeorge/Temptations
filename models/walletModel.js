const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    balance: {
        type: Number,
        validate: {
            validator: Number.isFinite,
            message: '{VALUE} is not a valid number for balance.',
        },
        default: 0,  // Set a default value for balance
    },
});

module.exports = mongoose.model("Wallet", walletSchema);
