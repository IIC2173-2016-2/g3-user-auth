const express = require('express');
const router = express.Router();
const redis = require('redis');
const moment = require('moment');

const client = redis.createClient();
client.select(0, (err, res) => {
  if (err) throw err;
});

const User = require('../models/user');
const UserChat = require('../models/user_chat');

router.patch('/users-chats/register', checkAPIKey, registerChat);
router.patch('/users-chats/deregister', checkAPIKey, deregisterChat);
router.get('/users-chats/list', checkAPIKey, getChats);

function registerChat(req, res)
{
  UserChat.register(req.get('user_id'), req.get('chat_id'), function(err){
    if(err)
    {
      console.log(err);
      res.status(500);
      res.send('Unable to register chat');
    }
    else
    {
      client.zadd(["users_chats_ttl", moment(Date.now()).utc().add(24, 'hours').unix(), `${req.get('user_id')},${req.get('chat_id')}`], function(err, response){
        if(err)
        {
          console.log(err);
        }
      });
      res.send('Chat registered');
    }
  });
}

function getChats(req, res)
{
  UserChat.listUserChats(req.get('user_id'), function(err, userChats){
    if(err)
    {
      console.log(err);
      res.status(500);
      res.send('Unable to get chats');
    }
    else
    {
      res.send(userChats);
    }
  });
}

function deregisterChat(req, res)
{
  UserChat.deregister(req.get('user_id'), req.get('chat_id'), function(err){
    if(err)
    {
      console.log(err);
      res.status(500);
      res.send('Unable to deregister chat');
    }
    else
    {
      client.zscan(["users_chats_ttl", 0, "MATCH", `*,${req.get('chat_id')}`], function(err, response){
        if(!err){
          to_remove = response[1][0];
          client.zrem("users_chats_ttl", to_remove, function(err, response)
            {
              if(err)
              {
                console.log(err);
              }
            });
        }
      });
      res.send('Chat deregistered');
    }
  });
}

function checkAPIKey(req, res, next)
{
  if (req.get('USERS_CHAT_API_KEY') == process.env.USERS_CHAT_API_KEY)
  {
    next();
  } 
  else{
    res.status(401);
    const err = new Error('Not Authenticated');
    err.status = 401;
    next(err);
  }
}

module.exports = router;