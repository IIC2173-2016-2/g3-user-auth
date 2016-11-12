
const cassandra = require('express-cassandra');
var serviceCassandra = require('../services/cassandra');

function connect(callback) {
    var models = serviceCassandra.createClient();

    models.connect(function (err) {
        if (err) throw err;

        var UserModel = models.loadSchema('users', {
            fields:{
                users_id    : "text",
                users_arquicoins : "int",
                users_updated_at     : "timestamp",
                users_account_type: "text",
                users_credit_number: "int",
                users_csv_number: "int"
            },
            key:["users_id"]
        }, function(err){
            //the table in cassandra is now created
            //the models.instance.Person or UserModel can now be used to do operations
            // console.log(models.instance.Users);
            // console.log(models.instance.Users === UserModel);
            callback(UserModel);
        });
    });
}
module.exports = {
    connect: connect
};
