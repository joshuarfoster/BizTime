const express = require("express");
const slugify = require('slugify')
const router = express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

router.get('/', async (req,res,next) => {
    try{
        const results = await db.query(`SELECT * FROM companies`)
        return res.json({companies : results.rows})   
    }catch(e){
        next(e)
    }

})

router.get('/:code', async (req,res,next) => {
    try{
        const code = req.params.code;
        const cResult = await db.query(`SELECT * FROM companies WHERE code = $1`, [code]);
        if (cResult.rows.length === 0){
            e = new ExpressError('no company found', 404);
            return next(e);
        }
        const iResult = await db.query(`SELECT id FROM invoices WHERE comp_code=$1`,[code]);
        const dResult = await db.query(`SELECT d.industry FROM companies_industries AS ci INNER JOIN industries as d ON ci.ind_code = d.code WHERE ci.comp_code = $1`,[code])
        const company = cResult.rows[0];
        company['invoices']=iResult.rows;
        company['industries']=dResult.rows;
        return res.json({company: company});
    }catch(e){
        return next(e);
    }
})

router.post('/', async (req,res,next) =>{
    try{
        const {code, name, description} = req.body ;
        const slug = slugify(code, {
            lower: true,
            replacement: '_'
        })
        const result = await db.query('INSERT INTO companies (code, name, description) VALUES ($1,$2,$3) RETURNING *', [slug,name,description]);
        return res.status(201).json({company : result.rows[0]})
    }catch(e){
        return next(e);
    }
})

router.put('/:code', async (req,res,next) =>{
    try{
        const code = req.params.code;
        const {name, description} = req.body;
        const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING *`,[name,description,code]);
        if (result.rows.length === 0){
            e = new ExpressError('no company found', 404);
            return next(e);
        }
        return res.status(201).json({company : result.rows[0]})
    }catch(e){
        next(e)
    }
})

router.delete('/:code', async (req,res,next) =>{
    try{
        const code = req.params.code;
        const result = await db.query(`DELETE FROM companies WHERE code=$1 RETURNING *`,[code]);
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