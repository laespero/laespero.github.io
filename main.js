var Android;

var player;
var videoId;

var data = { listen: listen, tapGame: tapGame, video: video, pron: pron, sentence: sentence, voca: voca, info: info};


////

const PACKAGE_VERSION = "1.0.1";
const PACKAGE_NAMESPACE = "lobanov/" + "elm-localstorage";

function LocalStorageInstall(taskPort) {
  const ns = taskPort.createNamespace(PACKAGE_NAMESPACE, PACKAGE_VERSION);

  ns.register("localGet", (key) => window.localStorage.getItem(key));
  ns.register("localPut", ({key, value}) => window.localStorage.setItem(key, value));
  ns.register("localRemove", (key) => window.localStorage.removeItem(key));
  ns.register("localList", () => {
    const names = Array(window.localStorage.length);
    for (let index = 0; index < names.length; index++) {
      names[index] = window.localStorage.key(index);
    }
    return names;
  });
  ns.register("localClear", () => window.localStorage.clear());

  ns.register("sessionGet", (key) => window.sessionStorage.getItem(key));
  ns.register("sessionPut", ({key, value}) => window.sessionStorage.setItem(key, value));
  ns.register("sessionRemove", (key) => window.sessionStorage.removeItem(key));
  ns.register("sessionList", () => {
    const names = Array(window.sessionStorage.length);
    for (let index = 0; index < names.length; index++) {
      names[index] = window.sessionStorage.key(index);
    }
    return names;
  });
  ns.register("sessionClear", () => window.sessionStorage.clear());

  // 유저 함수 START

  ns.register("getProgressList", (keyList) => {
      let resultList = [];

      try {
          for(let d of keyList) {
              let stored = localStorage.getItem(d);
              let finishedArr = stored ? JSON.parse(stored) : [];
              resultList.push(finishedArr);
          }
      } catch { }

      return resultList;
  });
  // 유저 함수 END
}

TaskPort.install();
LocalStorageInstall(TaskPort);

//// URl 제어
var app = Elm.Main.init({
    node: document.getElementById('myapp'),
    flags: ("http://test.com/" + location.search)
});

window.addEventListener('popstate', function () {
    try {
        app.ports.onUrlChange.send(("http://test.com/" + location.search));
    } catch {}
});

app.ports.pushUrl.subscribe(function(url) {
    try {
        baseUrl = [location.protocol, '//', location.host, location.pathname].join('');
        if(location.search != url) history.pushState({}, '', (baseUrl+url));
    } catch {}
});
//// URl 제어

var dataVersion = 6;
if (localStorage.getItem("data-version") != dataVersion) {
    localStorage.clear();
    localStorage.setItem("data-version", dataVersion);
}

var voices = [];

function setVoiceList() {
    voices = window.speechSynthesis.getVoices();
}

try {
    if (window.speechSynthesis) {
        voices = window.speechSynthesis.getVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = setVoiceList;
        }
    }
} catch (err) {
    console.log(err);
}


function speech(txt) {
    if (!window.speechSynthesis) {
        // console.log("음성 재생을 지원하지 않는 브라우저입니다. 크롬, 파이어폭스 등의 최신 브라우저를 이용하세요");
        return;
    }

    var lang = 'ja-JP';
//    var lang = 'de';

    var utterThis = new SpeechSynthesisUtterance(txt);
    utterThis.onend = function (event) {
        //console.log('end');
    };
    utterThis.onerror = function (event) {
        //console.log('error', event);
    };
    var voiceFound = false;
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.indexOf(lang) >= 0 || voices[i].lang.indexOf(lang.replace('-', '_')) >= 0) {
            utterThis.voice = voices[i];
            voiceFound = true;
        }
    }
    if (!voiceFound) {
//        console.log('voice not found');
        return;
    }
    utterThis.lang = lang;
    utterThis.pitch = 1;
    utterThis.rate = 1; //속도
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterThis);
}


app.ports.newTab.subscribe( url => location.href = url);

app.ports.sendToPlayer.subscribe(function (o) {
    try {
        if (o.tag == "start") {
            app.ports.fromPlayer.send({ tag: "start", data: data });
        }
        else if (o.tag == "clearWriteCanvas") {
            try {
                document.getElementsByTagName("write-canvas")[0].clear();
            }
            catch {}
        }
        else if (o.tag == "renameTitle") {
            try {
                document.title = o.data;
            }
            catch {}
        }
        else if (o.tag == "saveProgress") {
            var stored = localStorage.getItem(o.data.videoId);
            var finishedArr = stored ? JSON.parse(stored) : [];

            for (var i = 0; i < finishedArr.length; i++) {
                var ele = finishedArr[i];
                if (ele.name == o.data.name && ele.level == o.data.level) {
                    finishedArr[i] = o.data;
                    localStorage.setItem(o.data.videoId, JSON.stringify(finishedArr));
                    return;
                }
            }

            finishedArr.push(o.data);
            localStorage.setItem(o.data.videoId, JSON.stringify(finishedArr));
        }

        else if (o.tag == "saveBookmark") {
            localStorage.setItem(o.data.key, JSON.stringify(o.data.item));
        }
        else if (o.tag == "saveResult") {
            localStorage.setItem(o.data.key, JSON.stringify(o.data.item));
        }
        else if (o.tag == "setItem") {
            localStorage.setItem(o.data.key, o.data.item);
        }
        else if (o.tag == "log") {
            //console.log(o.data.name, o.data.data);
        }


        //유튜브
        if (o.tag == "loadVideo") {
            //console.log(o);

        }
        else if (player && o.tag == "playYoutube") {
            player.play();
        }
        else if (player && o.tag == "pauseYoutube") {
            player.pause();
        }
        else if (player && o.tag == "destroyYoutube") {
            player.destroy();
        }
        else if (player && o.tag == "seekToMillis") {
            player.seek(o.data / 1000, true);
        }
        else if (player && o.tag == "closeYoutube") {
            //player.stopVideo();
        }
        else if (player && o.tag == "getPlayerTime") {
            app.ports.fromPlayer.send({ tag: "playerTime", data: parseInt(player.get_current_time() * 1000) });
        }


        // 안드로이드
        if (Android) {
            if (o.tag == "showToast") {
                Android.showToast(o.data);
            } else if (o.tag == "endApp") {
                Android.endApp();
            } else if (o.tag == "speak") {
                Android.speak(o.data);
            } else if (o.tag == "log") {
                Android.log(o.data.name, o.data.data);
            } else if (o.tag == "pageMove") {
                Android.pageMove(o.data);
            } else if (o.tag == "purchase") {
                Android.purchase();
            }
        }
        else {
            if (o.tag == "speak") {
                speech(o.data);
            }
        }


    } catch (err) {
        console.log(err);
    }
});

// 액티비티 정지 처리
isActivityPaused = false;
function activePause() {
    isActivityPaused = true;
    player?.pause();
}

function activeResume() {
    isActivityPaused = false;
}

function subUserOk() {
    app.ports.fromPlayer.send({ tag: "subUser", data: true });
}

function subUserNo() {
    app.ports.fromPlayer.send({ tag: "subUser", data: false });
}


function activeResume() {
    isActivityPaused = false;
}

function onPlayerStateChange(event) {
    //console.log(event.current.player_state);
    const state = event.current.player_state;

    if (state == Youtube.Player.UNSTARTED) {

    } else if (state == Youtube.Player.PLAYING) {
        app.ports.fromPlayer.send({ tag: "playerState", data: "onPlaying" });
        app.ports.fromPlayer.send({ tag: "loadSuccess", data: null });
        if(isActivityPaused) player?.pause();
    } else if (state == Youtube.Player.PAUSED) {
        app.ports.fromPlayer.send({ tag: "playerState", data: "onPaused" });
    } else if (state == Youtube.Player.BUFFERING) {
        app.ports.fromPlayer.send({ tag: "playerState", data: "onBuffering" });
    }
}

function sendPlayerTime(time) {
    app.ports.fromPlayer.send({ tag: "playerTime", data: time });
}

function sendPlayerState(stateStr) {
    app.ports.fromPlayer.send({ tag: "playerState", data: stateStr });
}

function sendVideoDuration(dur) {
    app.ports.fromPlayer.send({ tag: "videoDuration", data: dur });
}

function sendBackPressed() {
    app.ports.fromPlayer.send({ tag: "backPressed", data: null });
}

function sendTimeShift(time) {
    app.ports.fromPlayer.send({ tag: "timeShift", data: time });
}


//////


