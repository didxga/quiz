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

   async function completeQuestion(qid) {
       let url = "api/v1/question?questionid="+qid + "&wronganw=" + wronganswer;
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
           render();
           eventhook();
           setTimeout(function () {
               narrate()
           },1000);
       }
   }

   function render() {
       var template = `<div class="question" id="${question._id}" data-solution="${question.solution}">
          <img src="quiz/${question.question}">
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

   preload();
})(window)
