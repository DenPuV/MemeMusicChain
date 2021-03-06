const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const { response } = require("express");
const qs = require("./queries");

qs.syncUsers();
const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(cookieParser("MemeRadioSecret"));

//app.get(('/', (request, response) => {  }))

app.get('/api/getpages', qs.getPages);
app.get('/api/getpage/:pageid', qs.getPage);
app.get('/api/searchpage', qs.searchPage);
app.get('/api/getspinner/:id', qs.getSpinner);
app.post('/api/setpage', qs.setPage);
app.post('/api/redactpage', qs.redactPage);
app.get('/api/deletepage/:id', qs.deletePage);
app.get('/api/getrandompage', qs.getRandomPage);
app.post('/api/register', qs.register);
app.post('/api/login', qs.login);
app.get('/api/logout', qs.logout);
app.get('/api/checklogin', (request, response) => {

    let user = { login: request.cookies.login, token: request.cookies.token};

    qs.checkUser(user.login, user.token)
    ? response.status(200).json({status: "Ok", user: user})
    : response.status(401).json({status: "Not authorized", user: user});
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});