var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;
app.use(bodyParser.json());


app.get('/', function(req, res) {
	res.send('Todo Api Root');
  }
);


app.get('/todos', middleware.requireAuthentication, function(req, res) {
	var queryParams = req.query;
	var whereDef = { userId: req.user.id };

	if (queryParams.hasOwnProperty('completed')) {
		whereDef.completed = (queryParams.completed === 'true');
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {		
		whereDef.description = {
	        $like: '%' + queryParams.q + '%'
	      };
	}

	db.todo.findAll({ where: whereDef })
	.then(function (todos) {

		if (!todos || todos.length === 0) {
			res.status(404).json( { alert: 'Not found!' } );
		}
		else {
			res.json(todos);
		}
	})
	.catch (function (e) {
		res.status(500).json(e);
	});
  }
);

app.get('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
    var whereDef = { id: todoId, userId: req.user.id };

	db.todo.findOne({ where: whereDef }).then(function (todo) {
			if (todo) {
				res.json(todo);
			}
			else 
				res.status(404).json({ alert: 'Todo id = ' + todoId + ' was not found!' });
		}
	).catch(function (e) {
		res.status(400).json(e);
	});	
  }
);

app.post('/todos', middleware.requireAuthentication, function(req, res) {	
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function (todo) {
        return req.user.addTodo(todo).then(function () {
            return todo.reload();
        }).then(function (todo) {
           res.json(todo.toJSON()); 
        });		
	}
	, function (e) {
		res.status(400).json(e);
	});
  }
);

app.put('/todos/:id', middleware.requireAuthentication, function(req, res) {

	if (!_.isObject(req.body)) {
		return res.status(400).json({
			"error": "No object has passed!"
		});
	}

	var body = _.pick(req.body, 'description', 'completed');

	if (_.isUndefined(body.completed) && _.isUndefined(body.description)) {
		return res.status(400).json({
			"error": "The object passed does not have one of the following properties: description as string, completed as boolean"
		});
	}

	if (!_.isUndefined(body.completed) && !_.isBoolean(body.completed)) {
		return res.status(400).json({
			"error": "The property completed is not a boolean"
		});
	}

	if (!_.isUndefined(body.description) && !_.isString(body.description)) {
		return res.status(400).json({
			"error": "The property description is not a string"
		});
	}

	if (!_.isUndefined(body.description) && body.description.trim().length === 0) {
		return res.status(400).json({
			"error": "The property description cannot be empty"
		});
	}


	var todoId = parseInt(req.params.id, 10);
    var whereClause = { id: todoId, userId: req.user.id };
    
    db.todo.findOne({ where: whereClause }).then(function(todo){
        
        if (todo) {    
                todo.update(body).then(function () {
                    res.json({ info: 'Element ' + todoId + ' was updated!'});
                })
                .catch(function (e) {
                    res.status(400).json(e);
                }); 
        }
        else {
            res.status(404).json({ info: 'Element ' + todoId + ' was not found!'});
        } 
                
    });
 	   
  }
);

app.delete('/todos/:id', middleware.requireAuthentication, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var whereClause = { id: todoId, userId: req.user.id };
    
    db.todo.findOne({ where: whereClause }).then(function(todo){
        
        if (todo) {    
                todo.destroy().then(function () {
                    res.json({ info: 'Element ' + todoId + ' was deleted!'});
                })
                .catch(function (e) {
                    res.status(400).json(e);
                });
        }
        else {
            res.status(404).json({ info: 'Element ' + todoId + ' was not found!'});
        } 
                
    });	
  }
);

app.post('/users', function (req, res) {
	var body = _.pick(req.body, 'email', 'password');

    if (typeof body.email !== 'string' || typeof body.password != 'string') {
        return res.status(400).send('The informations email and password need be informed!');
    }    

	db.user.create(body).then(function (user) {
		res.json(user.toPublicJSON());
	})
	.catch(function (e) {
		res.status(400).json(e);
	});
  }
);

app.post('/users/login', function (req, res) {
	var body = _.pick(req.body, 'email', 'password');
    var userInstance;

    if (typeof body.email !== 'string' || typeof body.password != 'string') {
        return res.status(400).send('The informations email and password need be informed!');   
    } 

    db.user.authenticate(body).then(function (user) {
        userInstance = user;
        var token = userInstance.generateToken('authentication');
        
        if (!token){
             res.status(401).send();
        }
        else 
        {        
            return db.token.create({
                token: token 
            });
        }        
    }).then (function (tokenInstance) {
        res.header('Auth', tokenInstance.token).json(userInstance.toPublicJSON());
    }).catch(function (msg) {
        res.status(401).json( { alert: msg } );
    });   
    
             
  }
);

app.delete('/users/login', middleware.requireAuthentication, function (req, res) {
    req.tokenInstance.destroy().then(function() {
        res.status(204).send();
      }
    ).catch(function (e) {
        res.status(500).send();
    });
});

db.sequelize.sync({force: false}).then(function() {

	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + '!');
	});
	
  }
);

