'use strict';
const chai = require("chai");
const chaiHttp = require("chai-http");

const { app, runServer, closeServer } = require("../server");

// this lets us use *expect* style syntax in our tests
const expect = chai.expect;

// this lets us make HTTP requests in our tests
chai.use(chaiHttp);

describe("Testing out recipes", function() {
    // before we run tests, we activate our
    // 'runServer', which returns a promise
    before(function() {
        return runServer();
    });
    // close server so it doesn't interfere with further tests later on concurrently
    after(function() {
        return closeServer();
    });

    // test strategy:
    // 1. make request to '/recipes'
    // 2. inspect response object and prove
    // it has the right code and right keys
    // in response object
    it("should list items on GET", function() {
        return chai
        .request(app)
        .get("/recipes")
        .then(function(res) {
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res).to.be.a("array");

            expect(res.body.length).to.be.at.least(1);
            const expectedKeys = ["id", "name", "ingredients"];
            res.body.forEach(function(item) {
                expect(item).to.be.a("object");
                expect(item).to.include.keys(expectedKeys);
            });
        });
    });


// test strategy
// 1. make a POST request with data for a new item
// 2. inspect response object, status code, and 'id'
it("should add item on post", function() {
    const newItem = { name: "salad", ingredients: ["lettuce"]};
    return chai
        .request(app)
        .post("/recipes")
        .send(newItem)
        .then(function(res) {
            expect(res).to.have.status(201);
            expect(res).to.be.json;
            expect(res.body).to.be.a("object");
            expect(res.body).to.include.keys("id", "name", "ingredients");
            expect(res.body.id).to.not.equal(null);
            // response should be deep equal to 'newItem' if we assign 'id' to it from 'res.body.id'
            expect(res.body).to.deep.equal(Object.assign(newItem, { id: res.body.id })
            );
        });
    });

    // test strategy:
    // 1. initialize some update data
    // 2. make a GET request so we can get an item to update
    // 3. add the 'id' to 'updateData'
    // 4. make a PUT request with 'updateData'
    // 5. inspect the response object, status code, and that we get back an updated item wiht the right data
    it("should update items on PUT", function() {
        // we initialize our updateData here and then update it with an 'id' property to PUT
        const updateData = {
            name: "bob",
            ingredients: ["blood", "guts"],
        };

        return (
            chai
                .request(app)
                // first we have to get so we have an idea of object to update
                .get("/recipes")
                .then(function(res) {
                    updateData.id = res.body[0].id;
                    // this will return a promise whose value will be the response object, which we can inspect in the next 'then' block.
                    return chai
                        .request(app)
                        .put(`recipes/$ {updateData.id}`)
                        .send(updateData);
                })
                // prove that the PUT request has right status code and returns updated item
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.a("object");
                    expect(res.body).to.deep.equal(updateData);
                })
        );
    });

    // test strategy
    // 1. GET recipes so we can get ID of one to delete
    // 2. DELETE an item and ensure we get back a status 204
    it("should delete items on DELETE", function() {
        return (
            chai
                .request(app)
                .get("/recipes")
                .then(function(res) {
                    return chai.request(app).delete(`/recipes/${res.body[0].id}`);
                })
                .then(function(res) {
                    expect(res).to.have.status(204);
                })
        );
    });
});