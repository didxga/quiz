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

exports.assign = async function(questions, type, username) {
    var client = await mgc.connect(url)
    var db = client.db("quiz");
    for(var i=0; i<questions.length; i++) {
        qid = questions[i]
        let a = {questionid: new ObjectID(qid), username: username, status: 0, type: type[i], addedAt: new Date()};
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
            questionList[i].type = "question"
            unassigned.push(questionList[i])
        }
    }
    var tutList = await db.collection("tutorial").find({}).toArray()
    var untut = []
    for(var j=0, ll=tutList.length; j<ll; j++){
        var assign = await db.collection("assignment").findOne({"questionid": tutList[j]._id, "username": username});
        if(!assign) {
            tutList[j].type = "tut";
            untut.push(tutList[j])
        }
    }
    var bookList = await db.collection("book").find({}).toArray();
    var unbook = [];
    for(var k=0, kl=bookList.length; k<kl; k++) {
        var assign = await db.collection("assignment").findOne({"questionid": bookList[k]._id, "username": username });
        if(!assign) {
            bookList[k].type = "book";
            unbook.push(bookList[k])
        }
    }
    client.close();
    return unassigned.concat(untut).concat(unbook);
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
        questionList[i].type = "question";
    }
    var tutList = await db.collection("tutorial").find({}).toArray()
    for(var j=0, ll=tutList.length; j<ll; j++){
        var assign = await db.collection("assignment").findOne({"questionid": tutList[j]._id, "username": username, "status": 0});
        if(assign) {
            tutList[j].assigned = 1;
        } else {
            tutList[j].assigned = 0;
        }
        tutList[j].type = "tut";
    }
    var bookList = await db.collection("book").find({}).toArray()
    for(var k=0, kl=bookList.length; k<kl; k++) {
        var assign = await db.collection("assignment").findOne({"questionid": bookList[k]._id, "username": username, "status": 0});
        if(assign) {
            bookList[k].assigned = 1;
        } else {
            bookList[k].assigned = 0;
        }
        bookList[k].type = "book";
    }
    client.close();
    return questionList.concat(tutList).concat(bookList);
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
            if (question) {
                question.type="question"
                client.close();
                res.json(question);
            } else {
                db.collection("tutorial").findOne({"_id": new ObjectID(questionid)}, function(err, question) {
                    question.type="tutorial"
                    client.close();
                    res.json(question);
                })
            }
        });
    })
}

exports.getBook = async function(username, res) {
    var client = await mgc.connect(url)
    var db =  client.db("quiz");

    var docs = await db.collection("assignment").find({"username": username, "status": 0, "type": "book"}).toArray();
    for(var i=0; i<docs.length; i++) {
        var book = await db.collection("book").findOne({"_id": new ObjectID(docs[i].questionid)})
        if(book) {
            client.close();
            return book;
        }
    }
    client.close();
}

exports.getAssignment = function(username, res) {
    questionList = [];
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("assignment").find({"username": username, "status": 0, $or: [{"type": "tut"}, {"type": "question"}]}).toArray(function (err, docs) {
            docs.forEach(function (assignment) {
                questionList.push(assignment.questionid);
            })
            res.json({questionList: questionList});
        });
        client.close();
    })
}

exports.saveBook = function(title, page, audio) {
    let book = {}
    book.title = title
    book.page = page
    book.audio = audio
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("book").insertOne(book);
        client.close();
    })
}

exports.saveTut = function(title, tutorial) {
    let tut = {}
    tut.title = title
    tut.vid = tutorial
    mgc.connect(url, function (err, client) {
        var db = client.db("quiz");
        db.collection("tutorial").insertOne(tut);
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
