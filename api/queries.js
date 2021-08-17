const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const passwordHash = require("password-hash");
//var hashedPassword = passwordHash.generate('password123');
//passwordHash.verify('password123', hashedPassword)

const {
    v1: uuidv1,
    v4: uuidv4,
} = require('uuid');
//uuidv1(); // -> '6c84fb90-12c4-11e1-840d-7b25c5ee775a' 
//uuidv4(); // -> '110ec58a-a0f2-4ac4-8393-c866d813b8d1' 

const Pool = require('pg').Pool;
const { request, response } = require("express");
const pool = new Pool({
    user: '*',
    host: '*',
    database: '*',
    password: '*',
    port: *,
});

var users = {};
const syncUsers = async () => {
    let query = `SELECT u.login, uk.key FROM userkey as uk JOIN "user" as u ON(u.id = uk.userid)`
    console.log("Syncing users tokens");
    pool.query(query, (error, result) => {
        if (error) console.log("Cannot sync users tokens\n" + error)
        else {
            result.rows.forEach(item => {
                users[item.login] = item.userkey;
            });
            console.log(`Users tokens syncing finished\nSynced ${Object.keys(users).length} users tokens`);
        }
    });
};

const getPages = (request, response) => {
    let user = { login: request.cookies.login, token: request.cookies.token };
    if(!checkUser(user.login, user.token)) {
        response.status("401").json({ status: "Not authorized" });
        return;
    };

    let query = `SELECT * FROM page WHERE userid = (SELECT id FROM "user" WHERE login = '${user.login}')`;
            pool.query(query, (error, result) => {
                if (error) response.status("400").json({ status: "Error", error: error });
                else {
                    response.status("200").json(result.rows.map(page => {
                        page.topleft = { id: page.topleft };
                        page.topright = { id: page.topright };
                        page.botleft = { id: page.botleft };
                        page.botright = { id: page.botright };
                        return page;
                    }));
                }
            })
};

const getPage = (request, response) => {
    let pageid = request.params.pageid;
    let query = `SELECT * FROM page WHERE id = '${pageid}'`;
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Error", error: error });
        else {
            response.status("200").json(result.rows.map(page => {
                page.topleft = { id: page.topleft };
                page.topright = { id: page.topright };
                page.botleft = { id: page.botleft };
                page.botright = { id: page.botright };
                return page;
            }));
        }
    });
};

const searchPage = (request, response) => {
    let search = request.query.search;
    let query = `SELECT * FROM page WHERE name ILIKE '%${search}%' LIMIT 10`;
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Error", error: error });
        else {
            response.status("200").json(result.rows.map(page => {
                page.topleft = { id: page.topleft };
                page.topright = { id: page.topright };
                page.botleft = { id: page.botleft };
                page.botright = { id: page.botright };
                return page;
            }));
        }
    });
};

const getRandomPage = (request, response) => {
    pool.query("SELECT * FROM page LIMIT 1 offset floor(random() * (SELECT count(*) FROM page))", (error, result) => {
        if (error) response.status("400"), json({ status: "Error", error: error })
        else {
            response.status("200").json(result.rows.map(page => {
                page.topleft = { id: page.topleft };
                page.topright = { id: page.topright };
                page.botleft = { id: page.botleft };
                page.botright = { id: page.botright };
                return page;
            }));
        }
    });
}

const getSpinner = (request, response) => {
    const spinnerid = request.params.id;
    pool.query(`SELECT * FROM spinner WHERE id = '${spinnerid}'`, (error, result) => {
        if (error) response.status("400").json({ status: "Error", error: error });
        else {
            response.status("200").json(result.rows);
        }
    });
};

const setPage = (request, response) => {
    const page = request.body;
    const user = {
        login: request.cookies.login,
        token: request.cookies.token
    };
    if(!checkUser(user.login, user.token)) {
        response.status("401").json({ status: "Not authorized" });
        return;
    };
    page.id = uuidv4();
    page.topleft.id = uuidv4();
    page.topright.id = uuidv4();
    page.botleft.id = uuidv4();
    page.botright.id = uuidv4();
    page.link = page.link ? page.link : "";

    let query = `BEGIN; INSERT INTO spinner (id, image, music) VALUES ('${page.topleft.id}', '${page.topleft.image}', '${page.topleft.music}'), ` +
        `('${page.topright.id}', '${page.topright.image}', '${page.topright.music}'), ` +
        `('${page.botleft.id}', '${page.botleft.image}', '${page.botleft.music}'), ` +
        `('${page.botright.id}', '${page.botright.image}', '${page.botright.music}'); ` +
        `INSERT INTO page (id, image, topleft, topright, botleft, botright, name, link, userid) VALUES ` +
        `('${page.id}', '${page.image}', '${page.topleft.id}', '${page.topright.id}', '${page.botleft.id}', '${page.botright.id}', '${page.name}', '${page.link}', (SELECT id FROM "user" WHERE login = '${user.login}')); COMMIT;`
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Spinner error", error: error, body: page, query: query });
        else {
            response.status(200).json({ status: "Ok", body: page });
        }
    });

};

const redactPage = (request, response) => {
    const page = request.body;
    const user = {
        login: request.cookies.login,
        token: request.cookies.token
    };
    if(!checkUser(user.login, user.token)) {
        response.status("401").json({ status: "Not authorized" });
        return;
    };

    let query = `BEGIN; UPDATE spinner SET image = '${page.topleft.image}', music = '${page.topleft.music}' WHERE id = '${page.topleft.id}'; ` +
        `UPDATE spinner SET image = '${page.topright.image}', music = '${page.topright.music}' WHERE id = '${page.topright.id}'; ` +
        `UPDATE spinner SET image = '${page.botleft.image}', music = '${page.botleft.music}' WHERE id = '${page.botleft.id}'; ` +
        `UPDATE spinner SET image = '${page.botright.image}', music = '${page.botright.music}' WHERE id = '${page.botright.id}'; ` +
        `UPDATE page SET image = '${page?.image}', name = '${page?.name}' WHERE id = '${page.id}' AND userid = (SELECT id FROM "user" WHERE login = '${user.login}'); COMMIT;`
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Spinner error", error: error });
        else {
            response.status(200).json({ status: "Ok" });
        }
    });
};

const deletePage = (request, response) => {
    const pageId = request.params.id;
    const user = {
        login: request.cookies.login,
        token: request.cookies.token
    }
    if(!checkUser(user.login, user.token)) {
        response.status("401").json({ status: "Not authorized" });
        return;
    };
    let query = `DELETE FROM page WHERE id = '${pageId}' AND userid = (SELECT id FROM "user" WHERE login = '${user.login}')`;
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Spinner error", error: error });
        else {
            response.status(200).json({ status: "Ok" });
        }
    });
};

const checkUser = (login, token) => {
    if(users[login] && token && users[login] === token) return true;
    else return false;

}

const login = (request, response) => {
    const user = request.body;
    let query = `SELECT id FROM "user" WHERE login = '${user.login}'`;
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Login error", error: error })
        else {
            if (result.rows.length < 1 || passwordHash.verify(user.password, result.rows[0].passwordhash)) response.status("401").json({ status: "Not varified", error: error })
            else {
                let userkey = uuidv4();
                pool.query(`INSERT INTO userkey(userid, key) VALUES ('${result.rows[0].id}', '${userkey}')`, (err, res) => {
                    if (err) response.status("400").json({ status: "Error", error: error })
                    else {
                        response.cookie('login', user.login);
                        response.cookie('token', userkey);
                        users[user.login] = userkey;
                        response.status('200').json({ status: 'Verified', token: userkey });
                    }
                });
            }
        };
    })
};

const logout = (request, response) => {
    const login = request.cookies.login;
    let query = `DELETE FROM userkey WHERE userid = (SELECT id FROM "user" WHERE login = '${login}')`;
    pool.query(query, (error) => {
        if (error) response.status("400").json({ status: "Logout error", error: error });
        else {
            response.cookie("login", '');
            response.cookie("token", '');
            delete users[login];
            response.status("200").json({ status: "OK" });
        };
    });
};

const register = (request, response) => {
    const user = request.body;
    let query = `INSERT INTO "user" (id, login, passwordhash) VALUES ('${uuidv4()}', '${user.login}', '${passwordHash.generate(user.password)}')`;
    pool.query(query, (error, result) => {
        if (error) response.status("400").json({ status: "Register error", error: error })
        else {
            login(request, response);
        }
    });
};

module.exports = {
    getPages,
    getPage,
    searchPage,
    getSpinner,
    setPage,
    redactPage,
    deletePage,
    getRandomPage,
    register,
    login,
    logout,
    checkUser,
    syncUsers
}