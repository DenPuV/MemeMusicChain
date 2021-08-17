const meme = new Vue({
    el: "#back",
    created: function() {
        this.audio = new Audio();
        this.audio.addEventListener("ended", event => {
            this.setMusic(this.nextMusic());
        });
        this.audio.addEventListener("canplaythrough", event => {
            this.startMusic();
        });
        this.audio.addEventListener("play", event => {
            this.spinners[this.currentIndex].downloading = false;
            this.spinners[this.currentIndex].playing = true;
            this.playing = true;
        });
        this.audio.addEventListener("pause", event => {
            this.spinners[this.currentIndex].downloading = false;
            this.spinners[this.currentIndex].playing = false;
            this.playing = false;
        });
    },
    data: {
        page: null,
        audio: null,
        playing: false,
        currentIndex: 0
    },
    computed: {
        currentMeme: function() {
            return this.spinners[this.currentIndex];
        },
        spinners: function() {
            return [
                {...this.page?.topleft, downloading: false, playing: false},
                {...this.page?.topright, downloading: false, playing: false},
                {...this.page?.botleft, downloading: false, playing: false},
                {...this.page?.botright, downloading: false, playing: false}
            ];
        },
    },
    methods: {
        nextMusic: function() {
            this.currentIndex++
            if(this.currentIndex > 3) {
                if(this.page.link) window.open("/?pageid=" + this.page.link,"_self")
                else this.currentIndex = 0;
            } 
            return this.currentIndex;
        },
        setMusic: function(spinnerIndex) {
            if(this.playing) this.stopMusic();
            this.currentIndex = spinnerIndex;
            this.spinners[this.currentIndex].downloading = true;
            this.audio.src = this.spinners[this.currentIndex].music;
        },
        startMusic: function() {
            if(!this.audio.src || this.audio.src != this.spinners[this.currentIndex].music)
                this.setMusic(this.currentIndex)
            else
                this.audio.play();
        },
        stopMusic: function() {
            this.spinners[this.currentIndex].downloading = false;
            this.spinners[this.currentIndex].playing = false;
            this.playing = false;
            this.audio.pause();
        },
        switchTo: function(newpage) { 
            this.stopMusic();
            this.currentIndex = 0;
            this.page = newpage;
            if(this.page.topleft.image == undefined) this.getSpinner(this.page.topleft, (data) => { this.page.topleft = data, this.togglePlay()});
            if(this.page.topright.image == undefined) this.getSpinner(this.page.topright, (data) =>  this.page.topright = data);
            if(this.page.botleft.image == undefined) this.getSpinner(this.page.botleft, (data) =>  this.page.botleft = data);
            if(this.page.botright.image == undefined) this.getSpinner(this.page.botright, (data) =>  this.page.botright = data);
        },
        getSpinner: function(spinner, callback) {
            
            fetch("https://purtov.top/api/getspinner/" + spinner.id)
            .then(res => res.json())
            .then(data => callback(data[0]))
            .catch(err => alert("Спиннер не загрузился, патамушта " + err))
        },
        togglePlay: function() {
            if(this.playing) this.stopMusic();
            else this.startMusic();
        }
    }
});

const memeslist = new Vue({
    el: "#sidebar",
    created:  async function () {
        let pageId = (new URL(window.location.href)).searchParams.get("pageid");
        if(pageId) {
            fetch("https://purtov.top/api/getpage/" + pageId)
            .then(res => res.json())
            .then(data => {
                memeslist.pages = data;
                if(pageId) {
                    let page = memeslist.pages.find(element => {
                        return element.id === pageId
                    });
                    if (page) meme.switchTo(page);
                }
                
            })
            .catch(err => alert("Мемы не загрузились, патамушта " + err))
        }
        else this.randomPage();
    },
    data: {
        pages: [],
        visible: false,
        searchstring: ""
    },
    computed: {
        link: function () {
            return meme?.page?.link;
        }
    },
    methods: {
        switchTo: (pageIndex) => meme.switchTo(memeslist.pages[pageIndex]),
        searchPage: function () {
            fetch("https://purtov.top/api/searchpage?search=" + this.searchstring)
            .then(res => { 
                if(res.status !== 200) return;
                return res.json();
            })
            .then(data => {
                memeslist.pages = data;
            })
            .catch(err => alert("Мемы не загрузились, патамушта " + err))
        },
        randomPage: function () {
            fetch("https://purtov.top/api/getrandompage")
            .then(res => { 
                if(res.status !== 200) return;
                return res.json();
            })
            .then(data => {
                if(data) {
                    meme.switchTo(data[0]);
                }
            })
            .catch(err => alert("Мемы не загрузились, патамушта " + err))
        },
        chain: function () {
            window.open("/redact?link=" + meme.page.id, "_self")
        },
        upChain: function () {
            window.open("/?pageid=" + this.link, "_self")
        },
    }
});