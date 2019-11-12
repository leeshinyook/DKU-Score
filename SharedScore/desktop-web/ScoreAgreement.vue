<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class="modal-header">
            <slot name="header">단쿠키 점수공개 서비스 개인정보 제공 처리 방침</slot>
          </div>

          <div class="modal-body">
            <p>단쿠키 점수공개 시스템을 서비스하기 위해 다음과 같은 개인정보를 제공하는데 동의합니다.</p>
            <ul>
              <li>단국대학교 포털 아이디 (학번)</li>
              <li>단국대학교 포털 패스워드</li>
              <li>수강 과목 정보 및 시험 점수</li>
            </ul>
            <p>
              단쿠키에서는 제공받은 포털 아이디와 패스워드로 포털에 로그인하여 점수를 가져옵니다.
              나의 성적 정보를 익명으로 제공하여, 다른 수강생 점수를 포함한 성적 통계 자료를 조회할 수 있게 됩니다.
            </p>
            <p>단쿠키에서 시험 점수를 제외한 패스워드 등의 어떠한 정보도 저장하지 않기 때문에, 조회할 때 마다 패스워드를 입력해주셔야 합니다.</p>
          </div>
          <div class="modal-footer">
            <slot name="footer">
              <button class="modal-default-button" @click="agree">동의 및 진행</button>
              <!-- click이벤트 발생시 agree메소드 실행 -->
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  created() {
    // vue life cycle에 의거해서 이 페이지가 생성되면 아래 통신 실행
    this.axios.post("/score/agreement").then(response => {
      if (response.data) {
        this.$emit("close"); //모달 닫기
      } else {
        this.agreement = response.data;
      }
    });
  },

  methods: {
    agree() {
      this.axios.post("/score/agreement/agree"); //동의api로 통신
      this.$emit("close"); // 모달 닫기
    }
  },

  data() {
    return {
      agreement: false
    };
  }
};
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 500px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header h3 {
  margin-top: 0;
  color: #42b983;
}

.modal-body {
  line-height: 1.5em;
  display: block;
  text-align: left;
}

.modal-body > p,
.modal-body > span {
  line-height: 1.5em;
}

.modal-default-button {
  display: block;
  margin: 0 auto;
  width: 300px;
  margin-top: 20px;
  padding: 10px;
  font-size: 20px;
  background: #d0cfcf;
  color: white;
}
.modal-default-button:hover {
  background: rgb(215, 189, 31);
  color: white;
}

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.1);
  transform: scale(1.1);
}

.logo {
  width: 100px;
}
.modal-header {
  font-size: 20px;
}
.agree_check {
  display: block;
  text-align: right;
  font-size: 15px;
}
.error_msg {
  display: block;
  padding: 5px;
  font-size: 15px;
  color: red;
}
</style>
