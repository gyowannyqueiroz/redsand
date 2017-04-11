var db = require('./db');
var r = require('rethinkdb');

module.exports =  {

    save: function(user, callback) {
        if (user.id) {
            var id = user.id;
            delete user.id;
            r.table('users').get(id).update(user).run(db.global.connection, function(err, result) {
                if (err) {
                    callback(err, 'ERROR');
                    return;
                }

                callback(null, 'UPDATED');
            });
        } else {
            user.create_date = new Date().toISOString();
            r.table('users').insert(user).run(db.global.connection, function (err, result) {
                if (err) {
                    callback(err, 'ERROR');
                    return;
                }

                callback(null, 'CREATED');
            });
        }
    },

    loginExists: function(login) {
        return r.table('users')('login').count(login).run(db.global.connection, function(err, count) {
           if (err) {
               throw err;
           }

           return Boolean(count > 0);
        });
    },

    findByLogin: function(userLogin, callback) {
        r.table('users').filter({login: userLogin}).run(db.global.connection, function(err, cursor) {
           if (err) {
               callback(err, null);
               return;
           }

           cursor.toArray(function(err, results) {
              if (err) {
                  callback(err, null);
                  return;
              }

              if (results.length === 0) {
                  callback(null, null);
              } else {
                  callback(null, results[0]);
              }
           });
        });

    },

    findByOrgId: function(orgId, callback) {
        r.table('users')
            .filter(function(user) {
                    return user('org_id').contains(orgId);
                })
            .run(db.global.connection, function(err, cursor) {
               if (err) {
                   callback(err, null);
                   return;
               }

               cursor.toArray(callback);
            });
    },

    findById: function(id, callback) {
        r.table('users').get(id).run(db.global.connection, function(err, user) {
            if (err) {
                callback(err, null);
                return;
            }
           callback(null, user);
        });
    },

    delete: function(id, callback) {
        r.table('users').get(id).delete().run(db.global.connection, function(err, result) {
           if (err) {
               callback(err, null);
               return;
           }

           if (result.deleted === 1) {
               callback(null, 'DELETED');
           } else {
               callback(null, 'NOT_FOUND');
           }
        });
    }

}