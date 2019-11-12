<template>
  <div class="login_wrapper">
    <img id="logo_img" src="../images/icon/logo.png" alt="단쿠키" />

    <h2>단쿠키 점수공개 시스템</h2>
    <span v-if="!showServiceAgreementModal">
      단국대 포털 계정으로 로그인하세요!
      <br />
      <br />
      <span class="alert">
        <i class="fa fa-bullhorn" aria-hidden="true">학번과 비밀번호는 익명점수공개 용도외에는 따로 저장되지 않습니다!</i>
      </span>
      <br />
      <br />
      <input
        type="text"
        placeholder="ID(학번)"
        v-model="user.username"
        @focusout="checkUsername"
        @keyup.enter="signUp"
      />
      <span class="warning_msg">{{usernameWarningMsg}}</span>
      <input
        type="password"
        placeholder="PASSWORD"
        v-model="user.password"
        @keyup.enter="signUp"
        @focusout="checkPassword"
      />
      <span class="warning_msg">{{passwordWarningMsg}}</span>
      <dk-btn v-on:click="signUp" :loading="loginLoading">로그인</dk-btn>
      <br />
      <span class="warning_msg">{{warningMsg}}</span>
      <p class="login_desc">
        점수는 모두
        <strong>익명</strong>으로 보여집니다.
        <br />
        <br />점수공개를 한 학우들의 점수를 기반으로 여러
        <strong>통계자료</strong>를 제공합니다.
        <br />
        <br />자신이 듣고 있는 수업외의 점수공개표 즉, 다른 수업의 점수공개표는 조회하실 수 없습니다.
      </p>
    </span>
    <sevice-agreement-modal
      v-if="showServiceAgreementModal"
      @close="showServiceAgreementModal=false"
    ></sevice-agreement-modal>
  </div>
</template>

<script>
import ScoreAgreement from "./ScoreAgreement.vue";
export default {
  components: {
    "sevice-agreement-modal": ScoreAgreement
  },
  data: function() {
    return {
      user: {
        username: "",
        password: ""
      },
      usernameWarningMsg: "",
      passwordWarningMsg: "",
      warningMsg: "",
      showServiceAgreementModal: true,
      loginLoading: false //로그인버튼 애니메이션
    };
  },
  methods: {
    signUp() {
      if (!this.checkUsername() || !this.checkPassword()) return false;
      this.loginLoading = true;

      this.axios
        .post("/score", { user: this.user })
        .then(res => {
          console.log(res.data);
          if (res.data === "단국대 인증에 실패했습니다.") {
            this.warningMsg = "일치하는 회원정보가 없습니다!";
            this.loginLoading = false;
          } else if (res.data === false) {
            this.warningMsg = "설문조사를 완료해주세요!";
            this.loginLoading = false;
          } else {
            this.$router.push("/score/list"); // 로그인 성공시 통계확인 페이지로 이동.
          }
        })
        .catch(error => {
          if (error.response.status === 401) {
            this.warningMsg = "단쿠키 로그인이 필요한 서비스입니다!";
            this.loginLoading = false;
          }
        })
        .then(() => {
          this.loginLoading = false;
        });
    },
    checkUsername() {
      // 단국대학교 학번포맷과 일치한지 확인
      if (this.user.username.length != 8) {
        this.usernameWarningMsg = "학번은 8자리 입니다.";
        return false;
      } else if (!/^\d+$/.test(this.user.username)) {
        this.usernameWarningMsg = "숫자만 입력 가능합니다.";
        return false;
      } else {
        this.usernameWarningMsg = "";
        return true;
      }
    },
    checkPassword() {
      // 단국대학교 비밀번호 포맷과 일치한치 확인
      if (this.user.password.length < 4 || this.user.password.length > 20) {
        this.passwordWarningMsg = "4자 ~ 20자로 입력해주세요.";
        return false;
      } else if (this.user.password.indexOf(" ") >= 0) {
        this.passwordWarningMsg = "공백은 사용할 수 없습니다.";
        return false;
      } else {
        this.passwordWarningMsg = "";
        return true;
      }
    }
  }
};
</script>

<style scoped>
.login_wrapper {
  width: 730px;
  margin: 0 auto;
  display: block;
  text-align: center;
  padding: 50px 0;
}
.alert {
  font-size: 12px;
  color: red;
}
.login_desc {
  font-size: 12px;
  line-height: 18px;
  padding: 30px;
  text-align: center;
}
.service_agreement {
  width: 600px;
}
.warning_msg {
  display: block;
  font-size: 18px;
  color: red;
}
.dk-btn {
  width: 305px;
  height: 50px;
}
#logo_img {
  border-radius: 50%;
  width: 250px;
  height: 250px;
}
input {
  border: 1px solid rgb(215, 189, 31);
  width: 300px;
  height: 50px;
  margin: 0 0 5px 0;
}
p {
  border: 1px solid rgb(215, 189, 31);
  background: white;
  width: 460px;
  margin: 0 auto;
  margin-top: 10px;
  padding: 5px;
  font-size: 12px;
  text-align: left;
}
</style>
