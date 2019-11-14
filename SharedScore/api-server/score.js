var express = require("express");
var router = express.Router();

var db = require("../models/db");
require("../models/score");
require("../models/user");
var Score = db.model("score");
var User = db.model("User");

var parseDKU = require("../addons/parseDKU"); //parseDKU는 단국대학교 웹크롤링을 위한 모듈입니다.
var middle = require("./middleware.js"); // 사용하고있는 미들웨어는 requireLoggenIn인데, 단쿠키홈페이지에 로그인되어있는지 확인하는 미들웨어입니다.


// 성적페이지의 회원, 강의코드와 강의명,점수를 중복없이 저장하는 함수입니다.
// Score라는 스키마에 저장한다.
function save(user, lecture, class_no, course_name, score) {
  return new Promise((resolve, reject) => {
    const conditions = {
      user,
      lecture,
      class_no
    };
    const update = {
      user,
      lecture,
      class_no,
      course_name,
      score
    };
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    };
    Score.findOneAndUpdate(conditions, update, options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// 최종 중간성적 조회
// 프론트에서 넘어온 학번과 아이디 정보로 크롤링, 위 save함수를 통해 크롤링된 데이터를 디비에 저장한다.
router.post("/", middle.requireLoggedIn, async (req, res) => {
  const username = req.body.user.username;
  const password = req.body.user.password;
  parseDKU
    .authenticate(username, password)
    .then()
    .catch(err => res.json(err.message));
  const $ = await parseDKU
    .authenticateAndParse(
      username,
      password,
      "https://webinfo.dankook.ac.kr/tiac/univ/cret/gdmg/views/findMidExamStuList.do?_view=ok&&sso=ok" //중간고사성적조회 페이지
    )
    .catch(err => console.log(err));
  if (!$("#ltrClGrInpListTbl")) res.json(false);
  const docs = [];
  $("#ltrClGrInpListTbl").each(function (i) { // 크롤링시작 (cheerio를 이용한다.)
    $(this)
      .find("tbody tr")
      .each(function (i) {
        if ($(this).find("td").length) {
          const scoreInfo = {
            lecture: $(this)
              .find("td")
              .eq(3)
              .text()
              .trim(),
            class_no: $(this)
              .find("td")
              .eq(4)
              .text()
              .trim(),
            course_name: $(this)
              .find("td")
              .eq(5)
              .text()
              .trim(),
            score: $(this)
              .find("td")
              .eq(6)
              .text()
              .trim()
          };
          docs.push(scoreInfo);
          if (scoreInfo.score !== "미입력") { // 성적을 크롤링할때 점수가 나온것만 저장
            save(
              req.user._id, // 회원 아이디 (단쿠키 아이디)
              scoreInfo.lecture,
              scoreInfo.class_no,
              scoreInfo.course_name,
              scoreInfo.score
            ).then(result => {
              console.log("save");
              console.log(result);
            });
          }
        }
      });
    res.json(docs);
  });
});

// 동의페이지에서 회원이 동의를 하였는지  User스키마에서 확인
router.post("/agreement", middle.requireLoggedIn, (req, res) => {
  // res.json(req.user._id)
  User.findById(req.user._id).exec((err, user) => {
    res.json(user.score_agreement);
  });
});

// 동의 버튼을 클릭하면 User스키마의 score_agreement프로퍼티를 true로 변경
router.post("/agreement/agree", middle.requireLoggedIn, (req, res) => {
  User.findById(req.user._id, function (err, doc) {
    doc.score_agreement = true;
    doc.save();
    res.sendStatus(200);
  }).catch(err => {
    console.error(err);
  });
});

// User가 듣는 강의 목록을 aggregate형태로 가져오는 쿼리
router.get("/scores", middle.requireLoggedIn, (req, res) => {
  // aggregate
  Score.findByUser(req.user._id) // 회원이 듣는 과목만 list에 담는다.
    .exec((err, docs) => {
      if (err || !docs) {
        return res.sendStatus(404);
      } else {
        list = docs;
      }
    })
    .then(() => {
      async function handOverList(list) {
        const promises = list.map(item => // map메소드를 이용해 list의 모든요소 접근
          aggregatedList(item.class_no, item.lecture)
        );
        // wait until all promises are resolved 모든 promises가 resolve될때 까지 기다린다. 비동기처리.
        await Promise.all(promises).then(data => {
          res.json(data);
        });
      }
      handOverList(list);
    });

});

// 해당과목을 aggregation하는 함수
function aggregatedList(classNo, lectureId) {
  return new Promise((resolve, reject) => {
    Score.aggregate([{
          $match: {
            lecture: lectureId,
            class_no: classNo
          }
        },
        {
          $group: {
            _id: {
              lecture: "$lecture",
              class_no: "$class_no",
              course_name: "$course_name"
            },
            scores: {
              $push: "$score"
            },
            // 여러 통계를 낸다.
            avgscore: {
              $avg: "$score"
            },
            maxscore: {
              $max: "$score"
            },
            minscore: {
              $min: "$score"
            },
            count: {
              $sum: 1
            }
          }
        }
      ])
      .exec((err, docs) => {
        if (err) return reject(err);
        resolve(docs);
      })
      .catch(reject);
  });
}

module.exports = router;
