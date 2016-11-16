var mongoose = require('mongoose');

var UserChatSchema = mongoose.Schema({
  user_id: {
    type: String,
    index: true,
    match: [/^[a-f\d]{24}$/, "Invalid id"]
  },
  chat_id: {
    type: String,
    match: [/^[a-f\d]{24}$/, "Invalid id"]
  }
});

var UserChat = module.exports = mongoose.model('UserChat', UserChatSchema);

module.exports.register = function(user_id, chat_id, callback){
  UserChat.create({user_id: user_id, chat_id: chat_id}, callback);
}

module.exports.deregister = function(user_id, chat_id, callback){
  UserChat.findOne({user_id: user_id, chat_id: chat_id}, function(err, userChat){
    if(err)
    {
      return callback(err);
    }
    else
    {
      UserChat.remove({user_id: user_id, chat_id: chat_id}, callback);
    }
  });
}

module.exports.listUserChats = function(user_id, callback){
  UserChat.find({user_id: user_id}, callback);
}