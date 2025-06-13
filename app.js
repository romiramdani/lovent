const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const app = express();
const methodOverride = require('method-override');
const routes = require('./routes/index.js');
require('dotenv').config();

const port = process.env.PORT;

const mysqlOptions = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}

const sessionStore = new MySQLStore(mysqlOptions);

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))

app.use(
    session({
        key: 'lovent_cookie',
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
        resave: false,
        saveUninitialized: true, 
        cookie: { maxAge: 1800000 } 
    })
);

app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.locals.currentUrl = req.path;    
    next();
});

app.use('/', routes)

app.listen(port, () => {
    console.log( `server running at http://localhost:${port} `);
    
})