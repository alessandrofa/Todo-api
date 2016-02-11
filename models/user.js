var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require("crypto-js");
var jwt = require("jsonwebtoken");

module.exports = function(sequelize, DataTypes) {
	return sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING,
            
        },
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},            
            set: function (value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);
                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
		}
	}, {
  hooks: {
    beforeValidate: function(user, options) {
      if (typeof user.email === 'string')  
           user.email = user.email.toLowerCase();
    }
  },
  classMethods: {
      authenticate: function(body) {
          var self = this;
          return new Promise(function (resolve, reject) {
              
                self.findOne({ where: { email: body.email.toLowerCase() } })
                .then(function (user) {

                    if (!user) {
                        reject('Email not found!');
                    }
                    else {
                        
                        if (!user.comparePassword(body.password))
                            reject('Wrong password!');
                        else 
                            resolve(user);
                    }
                })
                .catch (function (e) {
                    reject(e);
                });
                
          });
      }
  },
  instanceMethods: {
      toPublicJSON: function () {
        var json = this.toJSON();
        return _.pick(json, 'id', 'email', 'updatedAt', 'createdAt');  
      },
      comparePassword: function (passordValue) {
        return bcrypt.compareSync(passordValue, this.password_hash);  
      },
      generateToken: function (type) {
          if (!_.isString(type)) {
              return undefined;
          }
          try {
             var stringData = JSON.stringify({ id: this.get('id'), type: type });
             var encrypteData = cryptojs.AES.encrypt(stringData, "abc123!@#!").toString(); 
             var token = jwt.sign({ token: encrypteData }, 'querty098');
             return token;               
          } catch (e) {
              console.error(e);
             return undefined;
          }
      }
  }
});
};