var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;
app.use(bodyParser.json());


app.get('/', function(req, res) {
	res.send('Todo Api Root');
}
);



app.get('/todos', function(req, res) {
	var queryParams = req.query;
	var whereDef = {};

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

app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function (todo) {
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

app.post('/todos', function(req, res) {	
	var body = _.pick(req.body, 'description', 'completed');

	db.todo.create(body).then(function (todo) {
		res.json(todo.toJSON());
	})
	.catch(function (e) {
		res.status(400).json(e);
	});
}
);

app.put('/todos/:id', function(req, res) {

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
	db.todo.update(body, { where: { id: todoId } }).then(function () {
		res.json({ info: 'Element ' + todoId + ' was updated!'});
	})
	.catch(function (e) {
		res.status(400).json(e);
	});    
}
);

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	
	db.todo.destroy({ where: { id: todoId } }).then(function () {
		res.json({ info: 'Element ' + todoId + ' was deleted!'});
	})
	.catch(function (e) {
		res.status(400).json(e);
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

    if (typeof body.email !== 'string' || typeof body.password != 'string') {
        return res.status(400).send('The informations email and password need be informed!');   
    } 

    db.user.authenticate(body).then(function (user) {
        res.header('Auth', user.generateToken('authentication')).json(user.toPublicJSON());
    }, function (msg) {
        res.status(401).json( { alert: msg } );
    });            
}
);


db.sequelize.sync({force: false}).then(function() {

	app.listen(PORT, function() {
		console.log('Express listening on port ' + PORT + '!');
	});
	
}
);

