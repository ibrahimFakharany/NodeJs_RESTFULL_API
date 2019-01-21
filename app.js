// express app file that handling request for us
const express = require('express');
const app = express();
const productsRoutes = require('./api/routes/products');
const ordersRoutes = require('./api/routes/orders');
const gmailRoutes = require('./api/routes/gmail');
const dialogFlow = require('./api/routes/MyDialogFlow');
app.use('/products', productsRoutes);
app.use('/orders', ordersRoutes);
app.use('/gmail', gmailRoutes);
app.use('/myDialogFlow', dialogFlow);
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
module.exports = app;