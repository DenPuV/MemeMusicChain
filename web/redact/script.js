const defaultPage = () => {
    return {
        image: "/dokument.jpg",
        name: "Страница",
        topleft: {
            image: "/dokument.jpg",
            music: "/audio/meme.mp3"
        },
        topright: {
            image: "/dokument.jpg",
            music: "/audio/meme2.mp3"
        },
        botleft: {
            image: "/dokument.jpg",
            music: "/audio/meme3.mp3"
        },
        botright: {
            image: "/dokument.jpg",
            music: "/audio/memep.mp3"
        }
    };
}

const logger = new Vue({
    el: "#logger",
    created: function() {
        this.isLogged = (this.getCookie("login") && this.getCookie("token")) ? true : false;
    },
    data :{
        user: {
            login: null,
            password: null
        },
        isLogged: false
    },
    methods: {
        getCookie : function(name) {
            let matches = document.cookie.match(new RegExp(
                "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
              ));
              return matches ? decodeURIComponent(matches[1]) : undefined;
        },
        login: function() {
            if(this.isLogged) return;
            fetch("https://purtov.top/api/login", { method: "post", body: JSON.stringify(this.user), headers: {'Content-Type': 'application/json'} })
                .then((res) => { 
                    if(res.status !== 200) return;
                    this.isLogged = true;
                    sidebar.loadPages();
                })
                .catch(err => alert("Не вошел, патамушта " + err))
        },
        register: function() {
            fetch("https://purtov.top/api/register", { method: "post", body: JSON.stringify(this.user), headers: {'Content-Type': 'application/json'} })
                .then((res) => { 
                    this.isLogged = true;
                    sidebar.loadPages();
                })
                .catch(err => alert("Не зарегистрировался, патамушта " + err))
        },
        logout: function() {
            if(!this.isLogged) return;
            fetch("https://purtov.top/api/logout", { method: "get"})
                .then((res) => {
                    if(res.status !== 200) return;
                    this.isLogged = false;
                    sidebar.pages = [];
                    main.page = null;
                })
                .catch(err => alert("Шото не так, патамушта " + err))
        }
    }
});

const sidebar = new Vue({
    el: "#sidebar",
    created: async function () {
        this.loadPages();
        this.logger = logger;
    },
    data: {
        pages: [],
        win: null,
        logger: null
    },
    methods: {
        openPage: function (page) {
            main.page = page;
            main.loadSpinners();
        },
        newPage: defaultPage,
        loadPages: function() {
            fetch("/api/getpages")
            .then(res => res.json())
            .then(data => this.pages = data)
            .catch(err => alert("Мемы не загрузились, патамушта " + err))
        }
    }
});

const main = new Vue({
    el: "#main",
    created: function () {
        sidebar.win = this;
        let link = (new URLSearchParams(window.location.search)).get("link")
        if(link)
            this.page = {
                ...defaultPage(),
                link: link
            };
            this.buttonProc = this.save;
    },
    data: {
        page: null,
        audio: new Audio(),
        playingId: -1
    },
    computed: {
        spinners: function () {
            return [
                this.page.topleft,
                this.page.topright,
                this.page.botleft,
                this.page.botright
            ]
        }
    },
    methods: {
        play: function (id) {
            if (this.audio.paused || id != this.playingId) {
                this.audio.src = main.spinners[id].music;
                this.playingId = id;
                this.audio.play();
            }
            else
                this.audio.pause();
        },
        save: async function () {
            if (!logger.isLogged) { alert("Сначала надо войти"); return };
            main.page.link = (new URLSearchParams(window.location.search)).get("link");
            fetch("/api/setpage", { method: "post", body: JSON.stringify(main.page), headers: {'Content-Type': 'application/json'}, credentials: "include" })
                .then((res) => {
                    if(res.status !== 200) alert("Не сохранено");
                    else return res.json()
                })
                .then(data => {
                    if(!data) return;
                    main.page = data.body;
                    sidebar.pages.push(data.body);
                    alert("Сохранено");
                })
                .catch(err => alert("Не сохранено, патамушта " + err));
        },
        redact: async function () {
            if (!logger.isLogged) { alert("Сначала надо войти"); return };
            fetch("/api/redactpage", { method: "post", body: JSON.stringify(main.page), headers: {'Content-Type': 'application/json'}, credentials: "include" })
                .then((res) => {
                    if(res.status !== 200) alert("Не сохранено");
                    else alert("Сохранено");
                })
                .catch(err => alert("Не сохранено, патамушта " + err));
        },
        buttonProc: function () { },
        delProc: async function () {
            if (!logger.isLogged) { alert("Сначала надо войти"); return };
            if (!this.page?.id) return;
            fetch("/api/deletepage/" + this.page.id)
                .then((res) => {
                    if(res.status !== 200) { alert("Не удалено"); return;}
                    sidebar.pages.splice(sidebar.pages.indexOf(this.page), 1);
                    this.page = null;
                    alert("Удалено");
                })
                .catch(err => alert("Не удалено, патамушта " + err));
        },
        getSpinner: function (spinner, callback) {

            fetch("/api/getspinner/" + spinner.id)
                .then(res => res.json())
                .then(data => callback(data[0]))
                .catch(err => alert("Спиннер не загрузился, патамушта " + err))
        },
        loadSpinners: function () {
            if (this.page.topleft.image == undefined) this.getSpinner(this.page.topleft, (data) => this.page.topleft = data);
            if (this.page.topright.image == undefined) this.getSpinner(this.page.topright, (data) => this.page.topright = data);
            if (this.page.botleft.image == undefined) this.getSpinner(this.page.botleft, (data) => this.page.botleft = data);
            if (this.page.botright.image == undefined) this.getSpinner(this.page.botright, (data) => this.page.botright = data);
        }
    }
});