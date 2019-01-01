const express= require('express');
const router = express.Router();

router.get('/',(req, res, next) => {
    res.status(200).json({
        message: 'getting all orders'
    });

});

router.post('/:orderId', (req, res, next) => { 
    res.status(200).json({
        message: 'post product with product id', 
    orderId: req.params.orderId
    });
});

router.delete('/:orderId', (req, res, next) => {
    res.status(200).json({
        message: 'order deleted', 
        orderId : req.params.orderId
    });
});

module.exports = router;