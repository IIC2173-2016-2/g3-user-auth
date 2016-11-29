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

router.get('/users-chats/register', checkAPIKey, registerChat);
router.get('/users-chats/deregister', checkAPIKey, deregisterChat);
router.get('/users-chats/list', checkAPIKey, getChats);

function registerChat(req, res)
{
  UserChat.findOne({ user_id: req.get('USER-ID'), chat_id: req.get('CHAT-ID') }, function(err, docs){
    
    if(docs)
    {      
      res.send('Chat already registered');
    }
    else
    {
      UserChat.register(req.get('USER-ID'), req.get('CHAT-ID'), req.get('NAME'), function(err){
        if(err)
        {
          console.log(err);
          res.status(500);
          res.send('Unable to register chat');
        }
        else
        {
          client.zadd(["users_chats_ttl", moment(Date.now()).utc().add(24, 'hours').unix(), `${req.get('USER-ID')},${req.get('CHAT-ID')}`], function(err, response){
            if(err)
            {
              console.log(err);
            }
          });
          res.send('Chat registered');
        }
      }); 
    }
    
  });
}

function getChats(req, res)
{
  UserChat.listUserChats(req.get('USER-ID'), function(err, userChats){
    if(err)
    {
      console.log(err);
      res.status(500);
      res.send('Unable to get chats');
    }
    else
    {
      res.send(userChats.reverse());
    }
  });
}

function deregisterChat(req, res)
{
  UserChat.findOne({ user_id: req.get('USER-ID'), chat_id: req.get('CHAT-ID') }, function(err, docs){
    if(docs)
    {
      UserChat.deregister(req.get('USER-ID'), req.get('CHAT-ID'), function(err){
        if(err)
        {
          console.log(err);
          res.status(500);
          res.send('Unable to deregister chat');
        }
        else
        {
          client.zscan(["users_chats_ttl", 0, "MATCH", `*,${req.get('CHAT-ID')}`], function(err, response){
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
    else
    {
      res.send('No chat found');
    }
  });
}

function checkAPIKey(req, res, next)
{

  if (req.get('USERS-CHAT-API-KEY') == process.env.USERS_CHAT_API_KEY)
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