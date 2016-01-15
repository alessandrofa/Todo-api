var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;
var todos = [];
var todoNextId = 1;
app.use(bodyParser.json());


app.get('/', function (req, res) {
	res.send('Todo Api Root');
});

app.get('/todos', function (req, res) {
	var queryParams = req.query;
	var filteredTodos = todos;

	if (queryParams.hasOwnProperty('completed')) {
		filteredTodos = _.where(filteredTodos, { completed: (queryParams.completed === 'true') });
	}

	if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
		filteredTodos = _.filter(filteredTodos, function (todo) {
			return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;		
		});
	}

	res.json(filteredTodos);
});

app.get('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, { id: todoId });
	
	if (matchedTodo)		 
		res.json(matchedTodo);
	else
		res.status(404).send();	
});

app.post('/todos', function (req, res) {
	debugger;
	var body = _.pick(req.body, 'description', 'completed');


	if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
		return res.status(400).send();	
	}
	

	body.description = body.description.trim();
	body.id = todoNextId++;
	todos.push(body);
	
	res.json(body);
});

app.put('/todos/:id', function (req, res) {
	
	if (!_.isObject(req.body)) {
		return res.status(400).json({ "error": "No object has passed!" });
	}

	var body = _.pick(req.body, 'description', 'completed');

	if (_.isUndefined(body.completed) && _.isUndefined(body.description)) {
		return res.status(400).json({ "error": "The object passed does not have one of the following properties: description as string, completed as boolean" });
	}

	if (!_.isUndefined(body.completed) && !_.isBoolean(body.completed)) {
		return res.status(400).json({ "error": "The property completed is not a boolean" });
	}

	if (!_.isUndefined(body.description) && !_.isString(body.description)) {
		return res.status(400).json({ "error": "The property description is not a string" });
	}

	if (!_.isUndefined(body.description) && body.description.trim().length === 0) {
		return res.status(400).json({ "error": "The property description cannot be empty" });
	}

	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, { id: todoId });

	if (matchedTodo) {		 
		_.extend(matchedTodo, body);
		res.json(matchedTodo);
	}
	else
		res.status(404).json({ "error": "No todo item found with the id = '" + todoId.toString() + "'" });
});

app.delete('/todos/:id', function (req, res) {
	var todoId = parseInt(req.params.id, 10);
	var matchedTodo = _.findWhere(todos, { id: todoId });
	
	if (matchedTodo) {
		todos = _.without(todos, matchedTodo);
		res.json(matchedTodo);
	}
	else
		res.status(404).json({ "error": "No todo item found with the id = '" + todoId.toString() + "'" });	
});

app.listen(PORT, function (){
	console.log('Express listening on port '+ PORT +'!');
});