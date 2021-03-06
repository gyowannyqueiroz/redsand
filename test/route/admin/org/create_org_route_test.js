var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var describe = require("mocha").describe;
var it = require("mocha").it;
var afterEach = require("mocha").afterEach;
var beforeEach = require("mocha").beforeEach;
var config = require("../../../config_test.js");
var MockExpressRequest = require('mock-express-request');
var db = require("../../../../data/db.js");
var r = require('rethinkdb');
var orgDao = require("../../../../data/org_dao.js");
var _ = require('lodash');

describe('ADMIN - Create org route', function() {

    var instance;

    beforeEach(function (done) {
        instance = require('../../../../route/admin/org/create_org_route');
        db.init(config, function(err, connection) {
            db.global.connection = connection;
            done();
        });
    });

    afterEach(function (done) {
        r.table('orgs').delete().run(db.global.connection, function(err, result) {
            done();
        });
    });

    it('should create an org', function(done) {
        var reqBody = {
            "org_id": "my_app",
            "name": "Simple App Test",
            "tokenExpiration": "24h",
            "inactive": false
        };
        var request = new MockExpressRequest({
            method: 'POST',
            url: 'url',
            headers: {
                'Accept': 'application/json'
            },
            body: reqBody
        });
        var response = {
            actualStatus: 200,
            status: function(st) {
                this.actualStatus = st;
            },
            json: function(response) {
                expect(this.actualStatus).to.be.equal(200);
                expect(response.success).to.be.true;
                expect(response.message).to.be.equal('CREATED');

                orgDao.findByOrgId(reqBody.org_id, function(err, orgFound) {
                    expect(orgFound).to.not.be.an('undefined');
                    delete orgFound.id;
                    expect(_.isEqual(reqBody, orgFound)).to.be.true;
                    done();
                });
            }
        };

        //When
        instance(request, response);
    });

    it('should not create an org for an existing org id', function(done) {
        var reqBody = {
            "org_id": "my_app",
            "name": "Simple App Test",
            "tokenExpiration": "24h",
            "inactive": false
        };
        orgDao.save(reqBody, function(err, result) {
            var request = new MockExpressRequest({
                method: 'POST',
                url: 'url',
                headers: {
                    'Accept': 'application/json'
                },
                body: reqBody
            });
            var response = {
                actualStatus: 200,
                status: function(st) {
                    this.actualStatus = st;
                    return this;
                },
                json: function(response) {
                    expect(this.actualStatus).to.be.equal(400);
                    expect(response.success).to.be.false;
                    expect(response.message).to.be.equal('ORG_ID_EXISTS');

                    done();
                }
            };

            //When
            instance(request, response);
        });

    });

});