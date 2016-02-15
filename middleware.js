var crypto = require('crypto-js');

module.exports = function (db) {
  
  return {
      requireAuthentication: function(req, res, next) {
          var token = req.get('Auth') || '';
          
          db.token.findOne({
                where: {
                    tokenHash: crypto.MD5(token).toString()
                }   
            }              
          ).then(function (tokenInstance) {
              if (tokenInstance) {             
                req.tokenInstance = tokenInstance;
                return db.user.findByToken(token);
              }
          }).then(function(user) {
              if (!user) {
                  res.status(401).send();
              }
              else
              {
                req.user = user;
                next();
              }
          }, function (e) {
              res.status(401).send();
          });
      }
  };
    
};