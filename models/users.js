
const cassandra = require('express-cassandra');
var serviceCassandra = require('../services/cassandra');

function connect(callback) {
    var models = serviceCassandra.createClient();

    models.connect(function (err) {
        if (err) throw err;

        var UserModel = models.loadSchema('users', {
            fields:{
                users_id    : "text",
                users_username  : "text",
                users_arquicoins : "int",
                users_updated_at     : "timestamp",
                users_account_type: "text",
                users_credit_number: "text",
                users_csv_number: "int"
            },
            key:["users_id"],
            indexes: ["users_username"]
        }, function(err){
            callback(UserModel, models);
        });
    });
}
module.exports = {
    connect: connect
};
