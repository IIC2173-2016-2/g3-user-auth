var User = require('../models/users');

function addUser(user, callback) {

    const hash = {
        users_id: user._id.toString(),
        users_arquicoins: 0,
        users_updated_at: Date.now(),
        users_username: user._doc.username
    };

    User.connect(function(Users) {

        var newUser = new Users(hash);
        newUser.save(function (saveErr) {
            if (saveErr) {
                callback(saveErr, null);
            } else {
                callback(null, newUser)
            }
        });
    });
    // callback(null, {'amount': 10 });
}

module.exports = {
    addUser: addUser
};
