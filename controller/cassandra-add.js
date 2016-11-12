var User = require('../models/users');

function addUser(username, callback) {

    User.connect(function(Users) {
        // error, amount
        const Long = require('cassandra-driver').types.Long;

        Users.findOne({users_id: username}, function(err, user){
            if(err) {
                callback(err, {'amount': 0 });
            } else if(user) {
                callback(null, {'amount': user.users_arquicoins });
            } else {
              callback(null, {'amount': 0 });
            }
        });
    });
    // callback(null, {'amount': 10 });
}

module.exports = {
    addUser: addUser
};
