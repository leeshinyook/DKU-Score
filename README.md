# 단쿠키 점수공개서비스


1.구상목표와 나의 생각
--------
- 학우들의 중간고사 점수를 모아 과목별로 통계를 내면 좋지않을까?<br>
*왜?* 결국은 각 과목의 학점비율이 정해져있는 상대평가. 이 생각도 오류가 있겠지만,<br>
어느정도의 모집단의 평균은 실제 그 집단의 평균과 많이 다르지않을 것 이다.<br>
이 점수를 가지고 기말고사에 대비한다면 매우 큰 도움이 될 것 같다.


2.고려해야할 부분
-------
- 어떻게 학우들의 성적을 조작없이 데이터베이스에 저장할 것 인가?

- 동일한 과목은 과목코드가 같다. 어떻게 구분지을 것 인가?

3.해결
--------
+ 어떻게 학우들의 성적을 조작없이 데이터베이스에 저장할 것 인가?
    - 학우들의 단국대학교 학번과 비밀번호를 입력시켜 직접 크롤링을 통해 가져오자!
    - 그럼 보안은?
    - 단쿠키는 HTTPS를 사용하고있다. SSL또는 TLS통해 세션데이터가 암호화될 것이니 1차적 보안은 되어있다 생각.
    
    
+ 동일한 과목은 과목코드가 같다. 어떻게 구분지을 것 인가?
    - 크롤링범위를 늘리자. 동일한 분반은 없으니 분반까지 붙혀주면, 같은 과목이라도 구분이 가능하다.
    

4.기술스택
----------
- Main: **Vue.js** **Node.js** **MongoDB**
- Module: **Cheerio** **Axios** **Mongoose** **Express** **LineChart** 

5.개발과정
-----
0. 생각정리
    1. 학우들의 단국대학교 학번과 아이디를 가지고 단국대학교(중간고사성적조회페이지) 접속을 시도해야한다.
    2. 정상적으로 접속이 완료되면, HTML을 긁어 성적을 디비에 저장한다.
    3. 저장후, 그 접속한 학우가 듣는 수업을 골라내야한다.
    4. 수업을 골라냄과 동시에 이전에 저장된 그 수업과 동일한 수업을 듣는 학우들의 성적도 종합한다.(과목코드와 분반을 기준으로 종합한다.)
    5. Aggregation작업이 끝났으면, 이 데이터를 프론트단으로 넘겨주자.
    
    6. 넘어온 데이터를 파악하기 쉽게 성적을 정렬하고, 통계를 내고, 그래프로 그려주자

1. 크롤링모듈제작

    - 후보 : Puppeteer(Headless Chrome), Cheerio, Osmosis
    
    1. Puppeteer
    
        - Headless 브라우저가 사용자의 눈에 보여지지 않고 백그라운드환경에서 작동.
        - 스크린샷, 웹페이지 성능 측정 등 강력한 기능제공
        - But, 크롬에서만 작동 && 메모리과도사용
        
    2. Cheerio
    
        - jQuery셀렉터를 이용하여 파싱가능
        - 기존 단쿠키에서 사용하는 크롤링모듈
    
    3. Osmosis
        - 위 크롤러중에서 검색과 파싱속도가 빠른편
        - 용량이 상당히 가벼움

    - 2번을 선택한 이유는?
    
        - 이미 단쿠키에서 사용중인 크롤러이고, 추가적인 설치와 운영은 미래를 생각했을 때, 개발 및 보수가 어렵고 중복기능은 최대한 줄여야한다는 판단.

        
2. Aggregation 후 데이터넘겨주기

    - 사실 프로젝트를 하면서 가장 어려웠던 부분이었다. 그 이유는? **비동기처리**
    ``` javascript
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
    ```
    ``` javascript
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

    ```
    Aggregation이 비동기로 처리되다 보니, 모든 데이터를 가져오는 처리가 끝난후, 프론트로 데이터를 넘겨주어야한다. 이 과정에서 나는<br> 
    ES6, Promise에 관한 문법이 익숙지 않았고, 많은 고민의 시간을 보냈다. 끝내 내린 결론은 1차적으로 async, await문법을 통해 handOverList함수가 동기적으로     작동하도록 처리를 하고 이 여러개의 promise들을 promises에 담아 Promise.all을 통해 처리를 하는 판단을 내렸다.




6.배포
-------
    기존 단쿠키서버인 AWS가 이용되었다.
2019년 2학기 중간고사를 배포를 기점으로 정말 감사하게 1500명의 학우들이 이용하였고, 구글애널리틱스에는 7200



desktop-web
------
1. Score.vue - 통계자료 컴포넌트
2. ScoreAgreement.vue - 서비스이용약관 모달
3. ScoreLogin.vue - 로그인 컴포넌트


api-server
------
1. addons/parseDKU - 단국대학교 크롤링모듈
2. models/score.js - 서비스 데이터베이스(몽고디비) 스키마 설계
3. score.js - score api-server

service.mov
------
구현영상

# 이미지
