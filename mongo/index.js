var mgc = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = "mongodb://192.168.12.164:27017";

exports.getQuiz = function(questionid, res) {
    mgc.connect(url, function (err, client) {
        db = client.db("quiz");
        db.collection("question").findOne({"_id": new ObjectID(questionid)}, function(err, question) {
            res.json(question);
        });
    })
}

exports.getAssignment = function(username, batchnumber, res) {
    questionList = [];
    mgc.connect(url, function (err, client) {
        db = client.db("quiz");
        db.collection("assignment").find({"username": username, "batchnumber": batchnumber}).toArray(function (err, docs) {
            docs.forEach(function (assignment) {
                questionList.push(assignment.questionid);
            })
            res.render('index', {questionList: questionList});
        })
    })
}

exports.saveQuiz = function(question, narrative, solution, level, opts_word, opts_img) {
    let quiz = {};
    quiz.question = question
    quiz.narrative = narrative
    quiz.solution = getSolution(solution)
    quiz.level = level
    if(opts_img) {
       quiz.answers = sortedAnswers(opts_img)
       quiz.answer_format = "image"
    } else {
       quiz.answers = sortedAnswers(opts_word)
       quiz.answer_format = "text"
    }
    mgc.connect(url, function (err, client) {
        db = client.db("quiz");
        db.collection("question").insertOne(quiz);
        client.close();
    })
}

function getSolution(s) {
    return parseInt(s.substring(s.indexOf("_") + 1)) - 1;
}

function sortedAnswers(answers) {
   anws = []
   for (let key in answers)  {
        let index = key.lastIndexOf("_");
        let num = key.substring(index+1);
        anws[parseInt(num)-1] = answers[key];
   }
   return anws;
}
