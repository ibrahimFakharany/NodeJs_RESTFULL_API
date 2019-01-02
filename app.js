// express app file that handling request for us
const express = require('express');
const app = express();
const productsRoutes = require('./api/routes/products');
const ordersRoutes = require('./api/routes/orders');
const gmailRoutes = require('./api/routes/gmail');
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/gmail', gmailRoutes);
module.exports = app;