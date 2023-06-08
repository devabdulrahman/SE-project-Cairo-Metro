// import the knex library that will allow us to
// construct SQL statements

const fs = require('fs');
const path = require('path');

// define the configuration settings to connect
// to our local postgres server
const config = {
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '1234',
    database: 'postgres',
  }
};

// create the connection with postgres
const db =require ('knex')(config);
const sql = fs.readFileSync(path.join(__dirname,'','scripts.sql')).toString();
db.raw(sql).then(console.log('tables done!'));


// expose the created connection so we can
// use it in other files to make sql statements
module.exports = db;