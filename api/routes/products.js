//this webservice page for getting all products
const express = require('express');
const router = express.Router();
router.get('/', (req, res, next)=>{
    res.status(200).json({
        message: 'handlind get request for the products'
    });
});

router.post('/', (req, res, next)=>{
    res.status(200).json({
        message: 'handling post request for the products'
    });
});


router.get('/:productId',(req, res, next)=>{
    const id = req.params.productId;
    res.status(200).json({
        message: "you passed " + id
    }); 
});
module.exports = router;