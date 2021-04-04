var express = require('express');
var router = express.Router();
var mongo = require('../mongo')
var multer = require('multer');
var uuid = require('uuid');
var fs = require("fs");
var unzip = require("node-unzip-2")

var storage = multer.diskStorage(
    {
      destination: root + "/public/quiz",
      filename: function ( req, file, cb ) {
        let newname = uuid.v4();
        let ext = getFileExtension(file.originalname)
        cb( null, newname+ext);
      }
    }
);

function getFileExtension(fileName) {
  var index = fileName.indexOf(".")
  return fileName.substring(index);
}
var upload = multer({storage: storage})

/* GET home page. */
router.get('/q', function(req, res, next) {
    res.render("index");
});

router.get('/b', async function (req, res, next) {
    var book = await mongo.getBook(req.query.username, res)
    res.render('book', {"book":book});
})

router.get("/api/v1/assignment", function (req, res, next) {
    mongo.getAssignment(req.query.username, res)
})

router.put('/api/v1/question', function (req, res, next) {
  if(req.query.questionid) {
    mongo.completeQuestion(req.query.questionid, req.query.username, req.query.wronganw, res);
  }
});

router.get('/api/v1/question', function(req, res, next) {
  mongo.getQuiz(req.query.questionid, res)
});

router.get('/cms', function (req, res, next) {
  res.render('cms')
});

router.get('/question', async function (req, res, next) {
    var username = req.query.u;
    var filter = req.query.filter;
    if(filter && filter == "unassigned") {
        var questionList = await mongo.findUnAssignedQuestion(username);
    } else {
        var questionList = await mongo.findQuestion(username);
    }
    res.render('questions', {questionList: questionList, username: username});
})

router.get('/assignment', async function (req, res, next) {
    var userList = await mongo.getUsers();
    res.render('assignment', {userList: userList})
})

router.post('/assignto', function (req, res, next) {
    var username = req.body.username;
    var questionList = mongo.findQuestion(username);
    res.redirect('question?u=' + username + '&filter=unassigned');
})

router.post('/assign-question', function(req, res, next) {
 var a = req.body.assignmentlist;
 var username = req.body.username;
 if(a) {
   mongo.assign(a.split(","), username)
 }
 var n = req.body.unassignmentlist;
 if(n) {
   mongo.unassign(n.split(","), username)
 }
 res.redirect("question?u=" + username);
})

router.post('/upload-book', upload.any(), function (req, res, next) {
    let files = req.files;
    let page, audio;
    let title = req.body.title;
    if(files) {
        files.forEach(function (file) {
            if (file.fieldname == "page") {
                page = file.filename;
            } else if (file.fieldname == "audio") {
                audio = file.filename;
            }
        })
    }
    let extract = unzip.Extract({ path: 'public/quiz/' + page.substring(0, page.length-4) });
    extract.on('close',function(){
        fs.createReadStream("public/quiz/" + audio).pipe(unzip.Extract({ path: 'public/quiz/' + audio.substring(0, page.length-4) }))
    });
    fs.createReadStream("public/quiz/" + page).pipe(extract);

   mongo.saveBook(title, page.substring(0, page.length-4), audio.substring(0, audio.length-4));
   res.render("add_success");
})

router.post('/upload-tutorial', upload.any(), function (req, res, next) {
    let files = req.files;
    let tut;
    if(files) {
        files.forEach(function (file) {
            if (file.fieldname == "tutorial") {
                tut = file.filename;
            }
        })
    }
    let title = req.body.title;
    mongo.saveTut(title, tut);
    res.render("add_success");
})

router.post('/upload-question', upload.any(), function (req, res, next) {
  let files = req.files;
  let opts = {}
  let question;
  let narrative;
  if(files) {
    files.forEach(function (file) {
      if (file.fieldname.startsWith("opt_img_")) {
        opts[file.fieldname] = file.filename;
      } else if(file.fieldname == "narrative") {
       narrative = file.filename;
      } else if(file.fieldname == "question") {
        question = file.filename;
      }
    })
  }
  let level = req.body.level;
  delete req.body.level;
  let solution = req.body.answer;
  delete req.body.answer;
  if (!level || !solution) {
    res.render("add_failure")
  }
  if( req.body.opt_word_1) {
    for(var key in req.body) {
      if(key.startsWith("opt_word_")) {
        opts[key] = req.body[key];
      }
    }
    mongo.saveQuiz(question, narrative, solution, level, opts, null);
  } else {
    mongo.saveQuiz(question, narrative, solution, level, null, opts);
  }
  res.render("add_success");
});

module.exports = router;
