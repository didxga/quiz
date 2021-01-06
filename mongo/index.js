var mgc = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = "mongodb://localhost:27017";

exports.assign = async function(questions) {
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    for(var i=0; i<questions.length; i++) {
        params = questions[i].split("|")
        let a = {questionid: new ObjectID(params[0]), username: "yoyo", batchnumber: params[1], status: 0};
        await db.collection("assignment").insertOne(a);
    }
}

exports.unassign = async function(questionids) {
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    for(var i=0; i<questionids.length; i++) {
        let filter = {questionid: new ObjectID(questionids[i])};
        await db.collection("assignment").deleteOne(filter);
    }
}

exports.findQuestion = async function(res) {
    var questionList = []
    var client = await mgc.connect(url)

    var db = client.db("quiz");
    questionList = await db.collection("question").find({}).toArray()
    for(var i=0, l=questionList.length; i<l; i++) {
        var assignment = await db.collection("assignment").findOne({"questionid": questionList[i]._id});
        if(assignment) {
            if(assignment.status == 1) {
                questionList[i].assigned = -1;
            } else{
                questionList[i].assigned = 1;
            }
        } else {
            questionList[i].assigned = 0;
        }
    }
    client.close();
    res.render('questions', {questionList: questionList});
}

exports.completeQuestion = function(questionid, wronganw, res) {
    mgc.connect(url, function (err, client) {
       var db = client.db("quiz");
        db.collection("assignment").update({"questionid": new ObjectID(questionid), "status": 0}, {"$set": {"status": 1, "wronganw": wronganw}});
        client.close();
        res.json({state: "ok"});
    })
}

exports.getQuiz = function(questionid, res) {
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("question").findOne({"_id": new ObjectID(questionid)}, function(err, question) {
            res.json(question);
        });
        client.close();
    })
}

exports.getAssignment = function(username, batchnumber, res) {
    questionList = [];
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("assignment").find({"username": username, "batchnumber": batchnumber, "status": 0}).toArray(function (err, docs) {
            docs.forEach(function (assignment) {
                questionList.push(assignment.questionid);
            })
            res.json({questionList: questionList});
        });
        client.close();
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
       var db = client.db("quiz");
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
