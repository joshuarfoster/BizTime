process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async ()=>{
    const companies = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.'), ('ibm', 'IBM', 'Big blue.')`);
    const invoices = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('apple', 100, false, null), ('apple', 200, false, null), ('apple', 300, true, '2018-01-01'), ('ibm', 400, false, null)`);
    const industries = await db.query(`INSERT INTO industries (code, industry) VALUES ('cel','Consumer Electronics'), ('sof','Software')`)
    const companies_industries = await db.query(`INSERT INTO companies_industries (comp_code, ind_code) VALUES ('apple','cel'), ('apple','sof'), ('ibm','sof')`)
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies_industries`)
    await db.query(`DELETE FROM companies`)
    await db.query(`DELETE FROM industries`)
})

afterAll(async () =>{
    await db.end()
})


describe("GET /invoices", function() {
    test("Gets list of invoices", async function(){
        const res = await request(app).get('/invoices');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({"invoices": [{"comp_code": "apple", "id": expect.any(Number)}, {"comp_code": "apple", "id": expect.any(Number)}, {"comp_code": "apple", "id": expect.any(Number)}, {"comp_code": "ibm", "id": expect.any(Number)}]})
    })
});

describe("GET /invoices/:id", function() {
    test("Gets specific invoices", async function(){
        const res1 = await request(app).get('/invoices');
        id = res1.body['invoices'][0]['id']
        const res2 = await request(app).get(`/invoices/${id}`);
        expect(res2.statusCode).toEqual(200);
        expect(res2.body).toEqual({"invoice": {"add_date": expect.any(String), "amt": 100, "company": {"code": "apple", "description": "Maker of OSX.", "name": "Apple Computer"}, "id": expect.any(Number), "paid": false, "paid_date": null}})
    })
});

describe("PUT /invoices/:id", function() {
    test("Edits specific invoice", async function(){
        const res1 = await request(app).get('/invoices');
        id = res1.body['invoices'][0]['id']
        const res2 = await request(app).put(`/invoices/${id}`).send({"paid":true,"amt":100});
        expect(res2.statusCode).toEqual(201);
        expect(res2.body).toEqual({"invoice": {"add_date": expect.any(String), "amt": 100, "comp_code": "apple", "id": expect.any(Number), "paid": true, "paid_date": expect.any(String)}});
        const res3 = await request(app).get(`/invoices/${id}`);
        expect(res3.body).toEqual({"invoice": {"add_date": expect.any(String), "amt": 100, "company": {"code": "apple", "description": "Maker of OSX.", "name": "Apple Computer"}, "id": expect.any(Number), "paid": true, "paid_date": expect.any(String)}})
    })
});

describe("DELETE /invoices/:id", function() {
    test("Deletes an invoice", async function(){
        const res1 = await request(app).get('/invoices');
        id = res1.body['invoices'][0]['id'];
        const res2 = await request(app).delete(`/invoices/${id}`);
        expect(res2.statusCode).toEqual(200);
        expect(res2.body).toEqual({status: "deleted"});
        const res3 = await request(app).get('/invoices');
        expect(res3.body).toEqual({"invoices": [{"comp_code": "apple", "id": expect.any(Number)}, {"comp_code": "apple", "id": expect.any(Number)}, {"comp_code": "ibm", "id": expect.any(Number)}]})
    })
});