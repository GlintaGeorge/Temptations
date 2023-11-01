// orderHelper.js

const asyncHandler = require("express-async-handler");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const OrderItems = require("../models/orderItemModel");
const Product = require("../models/productModel");
const { generateUniqueOrderID } = require("../utility/generateUniqueId");
const Crypto = require("crypto");


/**
 * Get user's cart items
 */
exports.getCartItems = asyncHandler(async (userId) => {
    return await Cart.findOne({ user: userId }).populate("products.product");
});

/**
 * Calculate the total price of cart items
 */
exports.calculateTotalPrice = asyncHandler(async (cartItems, userid, ) => { //deleted payWithWallet, coupon
    
    let subtotal = 0;
    for (const product of cartItems.products) {
        const productTotal = parseFloat(product.product.salePrice) * product.quantity;
        subtotal += productTotal;
    }
    let total;
    
    total = subtotal;

    
        return {
            subtotal,
            total,
            
        };
    
});

/**
 *    Place an order   */
exports.placeOrder = asyncHandler(async (userId, addressId, paymentMethod, isWallet, coupon) => {
    const cartItems = await exports.getCartItems(userId);

    if (!cartItems && cartItems.length) {
        throw new Error("Cart not found or empty");
    }

    const orders = [];
    let total = 0;

    for (const cartItem of cartItems.products) {
        const productTotal = parseFloat(cartItem.product.salePrice) * cartItem.quantity;

        total += productTotal;

        const item = await OrderItems.create({
            quantity: cartItem.quantity,
            price: cartItem.product.salePrice,
            product: cartItem.product._id,
        });
        orders.push(item);
    }

    let discount;

    const address = await Address.findById(addressId);

    const existingOrderIds = await Order.find().select("orderId");
    // Create the order
    const newOrder = await Order.create({
        orderId: "OD" + generateUniqueOrderID(existingOrderIds),
        user: userId,
        orderItems: orders,
        shippingAddress: address.name,
        town: address.town,
        state: address.state,
        postCode: address.postCode,
        phone: address.phone,
        totalPrice: total.toFixed(2),
        payment_method: paymentMethod

        });

    return newOrder;
});

