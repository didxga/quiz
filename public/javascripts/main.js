(function(context) {
    var question;
    var alpha =["A", "B", "C", "D", "E", "F"]
    var num=0;
    var userAns = {};
    var questionList = document.querySelector(".board").getAttribute("data-questionlist").split(",");
    var audioSuccess = document.querySelector(".success");
    var audioRetry = document.querySelector(".retry");
   function eventhook() {
      let megaphoneBtn = document.querySelector(".control .megaphone");
      megaphoneBtn.addEventListener("click", function () {
          narrate()
      });
      let choices = document.querySelectorAll(".choice .opt");
      choices.forEach(function (elemt, key) {
         elemt.addEventListener("click", function () {
             judge(key)
         })
      })
   }

   function judge(key) {
     if (key === question.solution) {
         audioSuccess.play()
         setTimeout(function () {
             nextQ()
         }, 3000)
     } else {
         audioRetry.play()
     }
   }

   function nextQ() {
        num++;
        if(num >= questionList.length) {
           alert("Bingo!")
        } else {
            loadQuiz()
        }
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
       let resp = await fetch("api/v1/question?questionid="+questionList[num])
       if (resp.ok) {
           let json = await resp.json();
           question = json;
           render();
           eventhook();
           setTimeout(function () {
               narrate()
           },1500);
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

   function preload() {
       document.querySelector(".start").addEventListener(
           "click", function () {
               document.querySelector(".start").style.display = "none";
               document.querySelector(".mask").style.display = "none";
               loadQuiz()
           }
       )
   }

   preload();
})(window)
