process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async ()=>{
    const companies = await db.query(`INSERT INTO companies (code, name, description) VALUES ('apple', 'Apple Computer', 'Maker of OSX.'), ('ibm', 'IBM', 'Big blue.')`);
    const invoices = await db.query(`INSERT INTO invoices (comp_code, amt, paid, paid_date) VALUES ('apple', 100, false, null), ('apple', 200, false, null), ('apple', 300, true, '2018-01-01'), ('ibm', 400, false, null)`);
    const industries = await db.query(`INSERT INTO industries (code, industry) VALUES ('cel','Consumer Electronics'), ('sof','Software')`)
    const companies_industries = await db.query(`INSERT INTO companies_industries (comp_code, ind_code) VALUES ('apple','cel'), ('apple','sof'), ('ibm','sof')`)
});

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies_industries`)
    await db.query(`DELETE FROM companies`)
    await db.query(`DELETE FROM industries`)
});

afterAll(async () =>{
    await db.end()
});

describe("GET /companies", function() {
    test("Gets list of companies", async function(){
        const res = await request(app).get('/companies');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual(      {
            companies: [
              {
                code: 'apple',
                name: 'Apple Computer',
                description: 'Maker of OSX.'
              },
              { code: 'ibm', name: 'IBM', description: 'Big blue.' }
            ]
          })
    })
});

describe("GET /companies/:code", function(){
    test("Gets specific company", async function(){
        const res = await request(app).get('/companies/ibm');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({"company": {"code": "ibm", "description": "Big blue.", "industries": [{"industry": "Software"}], "invoices": [{"id": expect.any(Number)}], "name": "IBM"}})
    })
});

describe("POST /companies", function() {
    test("Makes new company", async function(){
        const res1 = await request(app).post('/companies').send({"code":"amz","name":"Amazon","description":"Online marketplace"});
        expect(res1.statusCode).toEqual(201);
        expect(res1.body).toEqual({"company": {"code": "amz", "description": "Online marketplace", "name": "Amazon"}});
        const res2 = await request(app).get('/companies/amz');
        expect(res2.statusCode).toEqual(200);
    })
    test("Slugifies codes", async function(){
        const res1 = await request(app).post('/companies').send({"code":"A M Z","name":"Amazon","description":"Online marketplace"});
        expect(res1.statusCode).toEqual(201);
        expect(res1.body).toEqual({"company": {"code": "a_m_z", "description": "Online marketplace", "name": "Amazon"}});
    })
})

describe("PUT /companies/:code", function(){
    test("Edits Company", async function(){
        res1 = await request(app).put('/companies/apple').send({"name":"Apple Devices", "description": "Maker of iPhone"});
        expect(res1.statusCode).toEqual(201);
        expect(res1.body).toEqual({"company": {"code": "apple", "description": "Maker of iPhone", "name": "Apple Devices"}});
        res2 = await request(app).get('/companies/apple');
        expect(res2.body).toEqual({"company": {"code": "apple", "description": "Maker of iPhone", "industries": [{"industry": "Consumer Electronics"}, {"industry": "Software"}], "invoices": [{"id": expect.any(Number)}, {"id": expect.any(Number)}, {"id": expect.any(Number)}], "name": "Apple Devices"}});
    })
})

describe("DELETE /companies/:code", function(){
    test("Deletes Company", async function(){
        res1 = await request(app).delete('/companies/ibm');
        expect(res1.status).toEqual(200);
        expect(res1.body).toEqual({status: "deleted"});
        res2 = await request(app).get('/companies');
        expect(res2.body).toEqual({"companies": [{"code": "apple", "description": "Maker of OSX.", "name": "Apple Computer"}]})
    })
})