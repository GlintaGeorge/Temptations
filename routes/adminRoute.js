const express = require('express');
const adminRoute = express.Router();
const adminController = require("../controller/adminControl")
const categoryController = require('../controller/categoryControl')
const productController = require('../controller/productControl')
const { upload } = require('../config/upload')
const { isAdminLoggedIn, isAdminLoggedOut } = require('../middlewares/adminAuth')
const { adminValidateID } = require('../middlewares/idValidation')
const nocache = require('nocache')
require('dotenv').config()
const methodOverride=require("method-override");


adminRoute.use((req, res, next) => {
    req.app.set('layout', 'admin/layouts/adminLayout');
    next();
})
adminRoute.use(nocache())
adminRoute.use(methodOverride("_method"))

// admin loginManagement---
adminRoute.get('/', isAdminLoggedOut, adminController.loadLogin)
adminRoute.post('/', adminController.verifyAdmin);
adminRoute.get('/logout', isAdminLoggedIn, adminController.logout)

// adminController.userManagement---
adminRoute.get('/dashboard', isAdminLoggedIn, adminController.loadDashboard)
adminRoute.get('/user', isAdminLoggedIn, adminController.userManagement)
adminRoute.post('/user/search', isAdminLoggedIn, adminController.searchUser)
adminRoute.post('/user/blockUser/:id', adminValidateID, isAdminLoggedIn, adminController.blockUser)
adminRoute.post('/user/unBlockUser/:id', adminValidateID, isAdminLoggedIn, adminController.unBlockUser)

// categoryManagement--- 
adminRoute.get('/category', isAdminLoggedIn, categoryController.categoryManagement)
adminRoute.get('/addCategory', isAdminLoggedIn, categoryController.addCategory)
adminRoute.post('/addCategory', isAdminLoggedIn, categoryController.insertCategory)
adminRoute.get('/category/list/:id', adminValidateID, isAdminLoggedIn, categoryController.list)
adminRoute.get('/category/unList/:id', adminValidateID, isAdminLoggedIn, categoryController.unList)
adminRoute.get('/editCategory/:id', adminValidateID, isAdminLoggedIn, categoryController.editCategory)
adminRoute.post('/editCategory/:id', adminValidateID, isAdminLoggedIn, categoryController.updateCategory)
adminRoute.post('/category/search', isAdminLoggedIn, categoryController.searchCategory)

// Product Management---
adminRoute.get('/product/addProduct', isAdminLoggedIn, productController.addProduct)

adminRoute.post('/product/addProduct',
    upload.fields([{ name: "images" }]),
    productController.insertProduct)  /** Product adding and multer using  **/
adminRoute.get('/products', isAdminLoggedIn, productController.productManagement)
adminRoute.post('/product/list/:id', adminValidateID, isAdminLoggedIn, productController.listProduct)
adminRoute.post('/product/unList/:id', adminValidateID, isAdminLoggedIn, productController.unListProduct)
adminRoute.get('/product/editproduct/:id', adminValidateID, isAdminLoggedIn, productController.editProductPage)
adminRoute.post('/product/editproduct/:id', adminValidateID, productController.updateProduct)
adminRoute.put('/product/edit-image/:id', adminValidateID,upload.single("image"), productController.editImage)
adminRoute.delete('/product/delete-image/:id', adminValidateID, productController.deleteImage)
adminRoute.post('/product/edit-image/:id', adminValidateID, upload.single("image"), productController.editImage);

// OrderManagement--


adminRoute.get("/orders", adminController.ordersPage);
adminRoute.get("/orders/:id", adminController.editOrder);
adminRoute.put("/orders/update/:id", adminController.updateOrderStatuss);
adminRoute.post("/orders/search", adminController.searchOrder);

// Coupon Management---

adminRoute.get("/coupon", adminController.couponspage);
adminRoute.get("/coupon/add", adminController.addCoupon);
adminRoute.get("/coupon/edit/:id", adminController.editCouponPage);
adminRoute.post("/coupon/add", adminController.createCoupon);
adminRoute.post("/coupon/edit/:id", adminController.updateCoupon);

adminRoute.get("/sales-report", adminController.salesReportpage);
adminRoute.get("/sales-data/yearly", adminController.getSalesDataYearly);
adminRoute.get("/get/sales-report", adminController.generateSalesReport);
adminRoute.get("/sales-data", adminController.getSalesData);
adminRoute.get("/sales-data/weekly", adminController.getSalesDataWeekly);

adminRoute.use((req, res) => {
    res.render("admin/page404", { title: "404", page: "404" });
});



adminRoute.get('*', (req, res) => { res.render('./admin/page404', { title: 'Error' }) })

module.exports=adminRoute;