(function(context) {
    var question;
    var alpha =["A", "B", "C", "D", "E", "F"]
    var num=0;
    var wronganswer = 0;
    var userAns = {};
    var questionList;
    var judging = false;
    var audioSuccess = document.querySelector(".success");
    var audioRetry = document.querySelector(".retry");
    var yeah = document.querySelector(".congrats");
    var peerConnection = new RTCPeerConnection();
    //var socket = io();
    var teacherId;

   function eventhook() {
      let megaphoneBtn = document.querySelector(".control .megaphone");
      megaphoneBtn.addEventListener("click", function () {
          narrate()
      });
      let choices = document.querySelectorAll(".choice .opt");
      choices.forEach(function (elemt, key) {
         elemt.addEventListener("click", function () {
             if(!judging) {
                 judging = true;
                 judge(key)
             }
         })
      })
   }

   function judge(key) {
     if (key === question.solution) {
         audioSuccess.play()
         setTimeout(function () {
             nextQ()
             judging=false;
         }, 3000)
     } else {
         judging = false;
         wronganswer++;
         audioRetry.pause()
         audioRetry.currentTime = 0;
         audioRetry.play()
     }
   }

   function nextQ() {
       completeQuestion(questionList[num])
       num++;
        if(num >= questionList.length) {
            stopAudios();
           document.querySelector(".mask").style.display = "block";
           yeah.style.display = "block";
           setTimeout(function () {
               window.location.reload()
           }, 2000)
        } else {
            loadQuiz()
        }
   }
   window.nextQ = nextQ

   async function completeQuestion(qid) {
       let url = "api/v1/question" +  getUsername() + "&questionid="+qid + "&wronganw=" + wronganswer;
       let resp = await fetch(url, {method: "PUT"})
       wronganswer=0;
   }

   function narrate() {
      stopAudios();
      let audio = document.querySelector(".narrative")
      audio.play()
   }

   function stopAudios() {
       let audios = document.querySelectorAll("audio");
       audios.forEach(function (element) {
           element.pause()
           element.currentTime = 0;
       })
   }

   async function loadQuiz() {
       let url = "api/v1/question?questionid="+questionList[num];
       let resp = await fetch(url)
       if (resp.ok) {
           let json = await resp.json();
           question = json;
           render(json.type);
           eventhook();
           if(!isTeacher()) {
               callTeacher()
           }
           setTimeout(function () {
               narrate()
           },1000);
       }
   }

   function render(type) {
       if(type=="question") {
          var template = `<div class="question" id="${question._id}" data-solution="${question.solution}">
             <div class="img-container" style="background-image:url(quiz/${question.question})">
             </div>
             </div>
             <div class="desc">
             </div>
            <div class="choice">`;
           var opts = ``;
           if(question.answer_format == "image") {
               question.answers.forEach(function (element, i) {
                   opts += `<div class="opt"><img src="quiz/${element}"><div>${alpha[i]}</div></div>`
               })
           } else {
               question.answers.forEach(function (element, i) {
                   opts += `<div class="opt"><div>${element}</div><div>${alpha[i]}</div></div>`
               })
           }
           var rest =
               `</div>
                <audio class="narrative">
                 <source src="quiz/${question.narrative}" type="audio/x-m4a">
                </audio>`;
           document.querySelector(".board").innerHTML = template + opts + rest;
       } else if(type=="tutorial") {
          var template = `<div class="tutorial">
                            <video id="tut-vid" src="quiz/${question.vid}" controls onended="nextQ()"></video>
                           </div>
                           `
           document.querySelector(".board").innerHTML = template;
       }
   }

   function getUsername() {
       return location.search;
   }

   function preload() {
       document.querySelector(".start").addEventListener(
           "click", function () {
               fetch("api/v1/assignment"+getUsername()).then(function (resp) {
                    if (resp.ok) {
                        resp.json().then(function (json) {
                            questionList = json.questionList;
                            if(questionList.length == 0) {
                                alert("作业已经完成了哦！")
                                return;
                            } else {
                                document.querySelector(".start").style.display = "none";
                                document.querySelector(".mask").style.display = "none";
                                loadQuiz()
                            }
                        })
                    }
               })

           }
       )
   }

   function isTeacher() {
       return location.search.indexOf("didxga")
   }

    async function callTeacher() {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        socket.emit("call-teacher", {
            offer,
            to: teacherId
        });
    }

   function recvSocket() {
       socket.on("init", (args) => {
           socket.emit("register", {socketid: socket.id, isTeacher: isTeacher()});
       })
       if(!isTeacher()) {
           socket.on("teacher-online", (args) => {
               teacherId = args.teacherId
               callTeacher();
           })
           socket.on("answer-made", async data => {
               await peerConnection.setRemoteDescription(
                   new RTCSessionDescription(data.answer)
               );
           });
       } else {
           socket.on("call-made", async data => {
               await peerConnection.setRemoteDescription(
                   new RTCSessionDescription(data.offer)
               );
               const answer = await peerConnection.createAnswer();
               await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

               socket.emit("make-answer", {
                   answer
               });
           });
       }
   }

   //recvSocket();

   function initChat() {
       peerConnection.ontrack = function({ streams: [stream] }) {
           const remoteVideo = document.getElementById("local-video");
           if (remoteVideo) {
               remoteVideo.srcObject = stream;
           }
       };
   }

   function localMedia() {
       navigator.mediaDevices.getUserMedia({audio: true}).then(
           stream => {
               const  localVideo = document.getElementById("local-video")
               if(localVideo) {
                   localVideo.srcObject = stream;
               }
           }
       ).catch(error => {
           alert(error.message)
       })
   }

  // initChat();
   preload();
})(window)
