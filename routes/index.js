var express = require('express');
var router = express.Router();
var mongo = require('../mongo')
var multer = require('multer');
var uuid = require('uuid');
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
  batchnumber = new Date().toLocaleDateString()
  mongo.getAssignment(req.query.username, batchnumber, res)
});

router.put('/api/v1/question', function (req, res, next) {
  if(req.query.questionid) {
    mongo.completeQuestion(req.query.questionid, res);
  }
});

router.get('/api/v1/question', function(req, res, next) {
  mongo.getQuiz(req.query.questionid, res)
});

router.get('/cms', function (req, res, next) {
  res.render('cms')
});

router.get('/question', function (req, res, next) {
   mongo.findQuestion(res);
})

router.post('/assign-question', function(req, res, next) {
 var a = req.body.assignmentlist;
 if(a) {
   mongo.assign(a.split(","))
 }
 var n = req.body.unassignmentlist;
 if(n) {
   mongo.unassign(n.split(","))
 }
 res.redirect("/question")
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
