var Sequelize = require('sequelize');
var sequelize = new Sequelize(undefined, undefined, undefined, {
	'dialect': 'sqlite',
	'storage': __dirname + '/basic-sqlite-database.sqlite'
});


var Todo = sequelize.define('todo', {
	description: {
		type: Sequelize.STRING,
		allowNull: false,
		validate: {
			len: [1, 250]
		}
	},
	completed: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	}
});

sequelize.sync({force: false}).then(function() {
	console.log('Everything is synced');


	Todo.findById(3).then(function (todo) {
			if (todo) {
				console.log(todo.toJSON());
			}
			else 
				console.log('Todo not found!');
		}
	);




/*


	Todo
	.create({ description: 'Meet my mom.' })
	.then(function(todo) {
		return Todo.create({ description: 'Walk with my dog.' });
	})
	.then(function (todo) {
		return Todo.create({ description: 'Test the new system.' });
	})
	.then(function (todo) {
		return Todo.create({ description: 'Travel all the world.' });
	})
	.then(function (todo) {
		return Todo.findAll({ where: {
				description: {
					$like: '%A%'
				}
		} });
	})
	.then(function (todos) {
		if (todos && todos.length > 0) {
			todos.forEach(function (todo) {		
				console.log(todo.toJSON());
			});
		}
		else 
			console.log('No todo found');
	})
	.catch(function (e) {
		console.log(e);
	});

*/


});

