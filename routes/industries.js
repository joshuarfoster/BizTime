const express = require("express");
const slugify = require('slugify')
const router = express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

router.get('/', async(req,res,next)=>{
    try{
        const result = await db.query('SELECT * FROM industries');
        const industries = result.rows;
        for(i of industries){
            const result2 = await db.query('SELECT comp_code FROM companies_industries WHERE ind_code = $1',[i['code']])
            companies = result2.rows
            i['companies'] = companies
        }
        return res.json({industries:industries})
    }catch(e){
        return next(e)
    }
})

router.post('/', async(req,res,next)=>{
    try{
        const {code, industry} = req.body;
        const slug = slugify(code, {
            lower:true,
            replacement: '_'
        });
        const result = await db.query('INSERT INTO industries (code, industry) VALUES ($1,$2) RETURNING *', [slug,industry]);
        return res.status(201).json({industry : result.rows[0]})
    }catch(e){
        return next(e)
    }
})

router.post('/:code', async(req,res,next)=>{
    try{
        const ind_code = req.params.code
        const comp_code = req.body.comp_code
        const result = await db.query(`INSERT INTO companies_industries (comp_code,ind_code) VALUES ($1,$2) RETURNING *`,[comp_code,ind_code]);
        return res.status(201).json({association: result.rows[0]})
    }catch(e){
        return next(e)
    }
})

module.exports = router;