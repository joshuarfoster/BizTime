const express = require("express");
const router = express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

router.get('/', async (req,res,next)=>{
    try{
        const results = await db.query('SELECT id, comp_code FROM invoices')
        return res.json({"invoices": results.rows})
    }catch(e){
        next(e)
    }
})

router.get('/:id', async (req,res,next) =>{
    try{
        id = req.params.id
        const iResult = await db.query(`SELECT * FROM invoices WHERE id=$1`, [id]);
        if (iResult.rows.length === 0){
            e = new ExpressError('no invoice found', 404);
            return next(e);
        }
        invoice = iResult.rows[0];
        const cResult = await db.query(`SELECT code, name, description FROM companies WHERE code=$1`,[invoice['comp_code']])
        invoice['company'] = cResult.rows[0]
        delete invoice.comp_code;
        return res.json({invoice: invoice})
    }catch(e){
        next(e)
    }
})

router.post('/', async (req,res,next)=>{
    try{
        const {comp_code, amt} = req.body;
        const result = await db.query("INSERT INTO invoices (comp_code, amt) VALUES ($1,$2) RETURNING *",[comp_code,amt])
        return res.status(201).json({invoice:result.rows[0]})
    }catch(e){
        next(e)
    }
})

router.put('/:id', async (req,res,next)=>{
    try{
        const id = req.params.id;
        const inputPaid = req.body.paid;
        const amt = req.body.amt;
        const pResult = await db.query("SELECT paid FROM invoices WHERE id=$1",[id])
        if(pResult.rows.length === 0){
            e = new ExpressError('no invoice found', 404);
            return next(e);
        }
        paid = pResult.rows[0]['paid']
        if (!paid && inputPaid){
            let now = new Date();
            let year = now.getFullYear();
            let month = now.getMonth() + 1;
            let day = now.getDate();
            let formattedDate = `${year}-${month}-${day}`;
            const result = await db.query(`UPDATE invoices SET paid=$1, amt=$2, paid_date=$3 WHERE id=$4 RETURNING *`,[inputPaid,amt,formattedDate,id]);
            return res.status(201).json({invoice:result.rows[0]})
        }
        if(paid && !inputPaid){
            const result = await db.query(`UPDATE invoices SET paid=$1, amt=$2, paid_date=null WHERE id=$3 RETURNING *`, [inputPaid,amt,id]);
            return res.status(201).json({invoice:result.rows[0]})
        }
        const result = await db.query(`UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING *`, [amt,id]);
        return res.status(201).json({invoice:result.rows[0]})
    }catch(e){
        next(e)
    }
})

router.delete('/:id', async (req,res,next)=>{
    try{
        const id = req.params.id;
        const result = await db.query(`DELETE FROM invoices WHERE id=$1 RETURNING *`,[id])
        if (result.rows.length === 0){
            e = new ExpressError('no company found', 404);
            return next(e);
        }
        return res.json({status:"deleted"})
    }catch(e){
        next(e)
    }
})

module.exports = router;