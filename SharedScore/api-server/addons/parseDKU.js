const customError = require('./customError');

const rp = require('request-promise');
const request = require('request');
const jar = request.jar();

const qs = require('querystring');
const cheerio = require('cheerio');

module.exports = {
  authenticate(username, password) {
    return new Promise((resolve, reject) => {
      this.authenticateAndParse(username, password, 'http://webinfo.dankook.ac.kr:80/tiac/univ/srec/srlm/views/findScregBasWeb.do?_view=ok&&sso=ok')
        .then($ => {
          if ($("#stuid").val() === username) {
            resolve(true);
          } else {
            reject(new customError("단국대 인증에 실패했습니다.", 200));
          }
        })
    });
  },

  authenticateAndParse(username, password, url) {
    return new Promise((resolve, reject) => {

      if (!username || !password) {
        return reject(new customError('`학번과`와 `단국대 포털 비밀번호`는 필수 파라미터 입니다.', 200));
      } else if (password < 8) {
        return reject(new customError('단국대 포털 비밀번호는 8자 이상으로 입력해주세요.', 200));
      } else if (password.indexOf(" ") >= 0) {
        return reject(new customError('단국대 포털 비밀번호는 공백은 사용할 수 없습니다.', 200));
      }

      const form = {
        username,
        password,
        dn: '',
        tabIndex: 0
      }

      const options = {
        timeout: 2500,
        method: 'POST',
        url: `https://webinfo.dankook.ac.kr/member/logon.do?returnurl=${url}`,
        followRedirect: true,
        followAllRedirects: true,
        jar: jar,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36',
          'Upgrade-Insecure-Requests': '1',
          'Referer': `https://webinfo.dankook.ac.kr/member/logon.do?returnurl=${url}`,
          'Origin': 'https://webinfo.dankook.ac.kr',
          'Host': 'webinfo.dankook.ac.kr',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': qs.stringify(form).length,
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
        },
        form
      };

      rp(options)
        .then(body => {
          resolve(cheerio.load(body, {
            decodeEntities: false
          }));
        })
        .catch(err => {
          reject(new customError('단국대 인증에 실패했습니다.', 200));
        });

    });
  }
};
