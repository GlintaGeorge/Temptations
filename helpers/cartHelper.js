
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");

function calculateCartTotals(products, coupon) {
    let subtotal = 0;
    for (const product of products) {
        const productTotal = parseFloat(product.product.salePrice) * product.quantity;
        subtotal += productTotal;
    }

    let total = subtotal;
    let discount = 0;

    if (coupon) {
        if (coupon.type === "percentage") {
            discount = ((total * coupon.value) / 100).toFixed(2);
            if (discount > coupon.maxAmount) {
                discount = coupon.maxAmount;
                total -= discount;
            } else {
                total -= discount;
            }
        } else if (coupon.type === "fixedAmount") {
            discount = coupon.value;
            total -= discount;
        }
    }

    return { subtotal, total, discount };
}

const findCartItem = async (userId, productId) => {
    return await Cart.findOne({ user: userId, "products.product": productId });
};

const findProductById = async (productId) => {
    return await Product.findById(productId);
};

const incrementQuantity = async (userId, productId, res) => {
    const updatedProduct = await findCartItem(userId, productId);

    if (!updatedProduct) {
        return res.json({ message: "Product not found in cart", status: "error" });
    }

    const foundProduct = updatedProduct.products.find((cartProduct) => cartProduct.product.equals(productId));

    const product = await findProductById(productId);

    if (foundProduct.quantity < product.quantity) {
        foundProduct.quantity += 1;

        await updatedProduct.save();

        const productTotal = product.salePrice * foundProduct.quantity;
        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total } = calculateCartTotals(cart.products);

        res.json({
            message: "Quantity Increased",
            quantity: foundProduct.quantity,
            productTotal,
            status: "success",
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
        });
    } else {
        const productTotal = product.salePrice * foundProduct.quantity;
        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total } = calculateCartTotals(cart.products);
        res.json({
            message: "Out of Stock",
            status: "danger",
            quantity: foundProduct.quantity,
            productTotal,
            subtotal: subtotal.toFixed(2),
            total: total.toFixed(2),
        });
    }
};

const decrementQuantity = async (userId, productId, res) => {
    const updatedCart = await Cart.findOne({ user: userId });
    const productToDecrement = updatedCart.products.find((item) => item.product.equals(productId));

    if (productToDecrement) {
        productToDecrement.quantity -= 1;

        if (productToDecrement.quantity <= 0) {
            updatedCart.products = updatedCart.products.filter((item) => !item.product.equals(productId));
        }

        const product = await findProductById(productId);

        await updatedCart.save();

        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total } = calculateCartTotals(cart.products);

        res.json({
            message: "Quantity Decreased",
            quantity: productToDecrement.quantity,
            status: "warning",
            productTotal: product.salePrice * productToDecrement.quantity,
            subtotal,
            total,
        });
    } else {
        const cart = await Cart.findOne({ user: userId }).populate("products.product");
        const { subtotal, total } = calculateCartTotals(cart.products);
        const product = await findProductById(productId);
        res.json({
            message: "Product not found in the cart.",
            status: "error",
            subtotal,
            total,
            productTotal: product.salePrice * productToDecrement.quantity,
        });
    }
};




module.exports = { decrementQuantity, findCartItem, findProductById, incrementQuantity, calculateCartTotals };