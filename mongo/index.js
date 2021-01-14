var mgc = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var url = "mongodb://localhost:27017";
//var url = "mongodb://192.168.12.164:27017";

exports.getUsers = async function() {
    var users = [];
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    userList = await db.collection("user").find({}).toArray();
    for(var i=0, l=userList.length; i<l; i++) {
       users.push(userList[i].username);
    }
    return users;
}

exports.assign = async function(questions, username) {
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    for(var i=0; i<questions.length; i++) {
        qid = questions[i]
        let a = {questionid: new ObjectID(qid), username: username, status: 0, addedAt: new Date()};
        await db.collection("assignment").insertOne(a);
    }
}

exports.unassign = async function(questionids, username) {
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    for(var i=0; i<questionids.length; i++) {
        let filter = {"questionid": new ObjectID(questionids[i]), "username": username, "status": 0};
        await db.collection("assignment").deleteOne(filter);
    }
}

exports.findUnAssignedQuestion = async function(username) {
    var questionList = []
    var unassigned = [];
    var client = await mgc.connect(url)

    var db = client.db("quiz");
    questionList = await db.collection("question").find({}).toArray()
    for(var i=0, l=questionList.length; i<l; i++) {
        var assignment = await db.collection("assignment").findOne({"questionid": questionList[i]._id, "username": username });
        if(!assignment) {
            unassigned.push(questionList[i])
        }
    }
    client.close();
    return unassigned;
}

exports.findQuestion = async function(username) {
    var questionList = []
    var client = await mgc.connect(url)

    var db = client.db("quiz");
    questionList = await db.collection("question").find({}).toArray()
    for(var i=0, l=questionList.length; i<l; i++) {
        var assignment = await db.collection("assignment").findOne({"questionid": questionList[i]._id, "username": username, "status": 0});
        if(assignment) {
            questionList[i].assigned = 1;
        } else {
            questionList[i].assigned = 0;
        }
    }
    client.close();
    return questionList;
}

exports.completeQuestion = function(questionid, username, wronganw, res) {
    mgc.connect(url, function (err, client) {
       var db = client.db("quiz");
        db.collection("assignment").update({"questionid": new ObjectID(questionid), "username":username, "status": 0}, {"$set": {"status": 1, "wronganw": wronganw}});
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

exports.getAssignment = function(username, res) {
    questionList = [];
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("assignment").find({"username": username, "status": 0}).toArray(function (err, docs) {
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
