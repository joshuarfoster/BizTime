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

describe("GET /industries", function() {
    test("Gets list of industries", async function(){
        const res = await request(app).get('/industries');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toEqual({"industries": [{"code": "cel", "companies": [{"comp_code": "apple"}], "industry": "Consumer Electronics"}, {"code": "sof", "companies": [{"comp_code": "apple"}, {"comp_code": "ibm"}], "industry": "Software"}]})
    })
});

describe("POST /industries", function(){
    test("Makes new Industry", async function(){
        const res1 = await request(app).post('/industries').send({"code":"stream", "industry":"Streaming"});
        expect(res1.statusCode).toEqual(201);
        expect(res1.body).toEqual({"industry": {"code": "stream", "industry": "Streaming"}});
        const res2 = await request(app).get('/industries')
        expect(res2.body).toEqual({"industries": [{"code": "cel", "companies": [{"comp_code": "apple"}], "industry": "Consumer Electronics"}, {"code": "sof", "companies": [{"comp_code": "apple"}, {"comp_code": "ibm"}], "industry": "Software"}, {"code": "stream", "companies": [], "industry": "Streaming"}]})
    })
})

describe("POST /industries/:code", function(){
    test("Associates company with industry", async function(){
        const res1 = await request(app).post('/industries/cel').send({"comp_code":"ibm"});
        expect(res1.statusCode).toEqual(201);
        expect(res1.body).toEqual({"association": {"comp_code": "ibm", "ind_code": "cel"}})
        const res = await request(app).get('/industries');
        expect(res.body).toEqual({"industries": [{"code": "cel", "companies": [{"comp_code": "apple"}, {"comp_code": "ibm"}], "industry": "Consumer Electronics"}, {"code": "sof", "companies": [{"comp_code": "apple"}, {"comp_code": "ibm"}], "industry": "Software"}]})
    })
})