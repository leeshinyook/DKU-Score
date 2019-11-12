<template>
    <div class="score_wrapper">
        <div class="sidebar">
            <ul>
                <span id="title">강의목록</span>

                <li v-for="(course, idx) in stu_info.course_name" :key="idx" v-on:click="open_score(idx)">
                    {{ course }}
                </li>
            </ul>
        </div>
        <div class="mainbar">
            <p class="stat_intro" v-show="!active">
                <strong><i class="fa fa-calendar" aria-hidden="true"></i> 단국대학교 중간고사 관련 학사일정</strong><br>
                <span class="calendar"> 2019학년도 2학기 중간강의평가기간 : 2019.09.30 ~ 2019.10.30 <br>
                2019학년도 2학기 중간고사 : 2019.10.14 ~ 2019.10.23 <br>
                2019학년도 2학기 중간성적 입력기간 : 2019.10.14 ~ 2019.10.30 <br>
                2019학년도 2학기 중간성적확인 및 공시기간 : 2019.10.14 ~ 2019.11.06</span>
                <strong><i class="fa fa-pie-chart" aria-hidden="true"></i> 점수공개 서비스 소개</strong>
                <span class="intro_introduce">
                서비스를 이용하는 학우들의 점수를 익명으로 공개하고, 강의 별 점수를 모아서 평균, 표준편차, 분산 등을 계산 후 공개된 점수들의 등수를 제공합니다. <br>
                점수를 공개하는 학우들이 많아 질수록, 강의별로 신뢰도 높은 통계와 그래프를 익명으로 확인하실 수 있습니다.<br>
                </span>
                <strong><i class="fa fa-star" aria-hidden="true"></i> 점수공개 서비스 이용방법</strong>
                <span class="intro_desc">
                1. 강의통계자료를 확인하시려면, 왼쪽 목록의 해당강의를 클릭하여 조회합니다. <br>
                2. 각 통계자료는 공개하는 새로운 인원이 로그인하면 바로바로 업데이트됩니다. <br>

                </span>
            </p>
            <p v-show="active" class="stat_chart">
                <strong><span> {{ stu_info.course_name[stat_idx] }}의 점수공개표</span></strong> <br><br>
                <line-chart :chart-data="getChartData(stat_idx)" :options="getChartOptions()" ></line-chart>
            </p>
            <p v-show="active_by_num" class="stat_rank">
                <strong><span>근접등수간 점수차이</span></strong> <br><br>
                가장 큰 점수차이를 보인 구간 : {{ max_gap_idx + 1}}등 ~ {{ max_gap_idx + 2}}등 <br>
                가장 큰 점수차이 : {{max_gap}}점 <br><br>
                <ul>
                    <li v-for="(gaps, idx) in gap" :key="idx">
                        {{idx+1}}등과 {{idx+2}}등의 점수차이 : {{gaps}}점
                    </li>
                </ul>
            </p>
            <p v-show="active" class="statistic">
                <span class="course_stat">
                <strong><span id="title"> {{ stu_info.course_name[stat_idx] }}의 통계자료</span></strong> <br><br>
                <div class="left"><span class="stat_title">점수공개 인원</span>  : <span class="stat_info">{{ stu_info.count[stat_idx]}}명</span>  <br>
                <!-- 공개된 점수 : {{ stu_info.score[stat_idx]}} <br> -->
                <span class="stat_title">평균점수</span>  : <span class="stat_info">{{ stu_info.avgscore[stat_idx].toFixed(2) }}</span> <br>
                <span class="stat_title">최고점수</span>  : <span class="stat_info">{{ stu_info.maxscore[stat_idx] }}</span> <br>
                <span class="stat_title">최저점수</span>  : <span class="stat_info">{{ stu_info.minscore[stat_idx] }}</span> <br></div>

                <div class="right"><span class="stat_title">분산</span>  : <span class="stat_info">{{ variance }}</span> <br>
                <span class="stat_title">표준편차</span>  : <span class="stat_info">{{ standard_deviation }}</span> <br>
                <span class="stat_title">(평균점수 +- 표준편차)</span>  : <span class="stat_info">{{avg_range.down}} ~ {{avg_range.up}}</span></div>

                </span>
            </p>
        </div>
    </div>
</template>

<script>
import LineChart from './LineChart.js'

export default {
  created () {
    // 데이터를 받아오는 통신
    this.axios.get('/score/scores')
              .then((response) => {
                console.log(response);
                // response데이터를 data()로 삽입
        for (let i = 0; i < response.data.length; i++) {
          this.stu_info.course_name.push(response.data[i]['0']._id.course_name)
          this.stu_info.count.push(response.data[i]['0'].count)
          this.stu_info.avgscore.push(response.data[i]['0'].avgscore)
          this.stu_info.minscore.push(response.data[i]['0'].minscore)
          this.stu_info.maxscore.push(response.data[i]['0'].maxscore)
          this.stu_info.score.push(response.data[i]['0'].scores)
        }
      })
      .catch((error) => {
        console.log(error)
      })
  },
  data () {
    return {
      stu_info: { //통계정보
        course_code: [],
        course_name: [],
        score: [],
        avgscore: [],
        maxscore: [],
        minscore: [],
        count: []
      },
      active: false,
      active_by_num: false,
      stat_idx: 0,
      sum: 0, //점수의 합
      variance: 0, // 분산
      standard_deviation: 0, // 표준편차
      gap: [], // 점수차이
      max_gap: 0, // 최고 점수차이
      max_gap_idx: 0,
      avg_range: { //평균범위
        up: 0,
        down: 0
      }

    }
  },
  components: {
    LineChart // 그래프를 그려주는 모듈
  },
  methods: {
    // idx에는 과목별 index를 가지고있다.
    // idx를 인자로 클릭된 과목의 통계자료를 보여주는 메소드
    open_score (idx) {
      console.log(idx)
      this.stat_idx = idx
      this.active = true
      this.gap = []
      this.max_gap = 0
      this.max_gap_idx = 0
      this.calculate(idx)
      this.sort_and_gap(idx)
    },
    // 통계 계산함수, 분산, 표준편차.
    calculate (idx) {
      for (var i = 0; i < this.stu_info.score[idx].length; i++) {
        this.sum += parseFloat(Math.pow((this.stu_info.score[idx][i] - this.stu_info.avgscore[idx]), 2).toFixed(2))
      }
      this.variance = (this.sum / this.stu_info.score[idx].length).toFixed(2)
      this.sum = 0
      this.standard_deviation = Math.sqrt(this.variance).toFixed(2)
      this.avg_range.up = (parseFloat(this.standard_deviation) + this.stu_info.avgscore[idx]).toFixed(2)
      this.avg_range.down = (this.stu_info.avgscore[idx] - this.standard_deviation).toFixed(2)
    },
    // 성적을 sorting하고 성적간 차이점 구하는 메소드
    sort_and_gap (idx) {
      this.stu_info.score[idx].sort(function (a, b) {
        return b - a
      })
      console.log(this.stu_info.score[idx])
      if (this.stu_info.score[idx].length > 1) {
        this.active_by_num = true
      } else {
        this.active_by_num = false
      }

      for (let i = 0; i < this.stu_info.score[idx].length - 1; i++) {
        this.gap[i] = (this.stu_info.score[idx][i] - this.stu_info.score[idx][i + 1]).toFixed(2)
      }
      for (let i = 0; i < this.gap.length; i++) {
        if (this.max_gap < parseFloat(this.gap[i])) {
          this.max_gap = parseFloat(this.gap[i])
          this.max_gap_idx = i
        }
      }
    },
    // chart그리기
    getChartData (stat_idx) {
      var labels = {
        'user_count': [] // Anonymous
      }
      var datum = {
        'score': []
      }
      for (let i = 0; i < this.stu_info.score[stat_idx].length; i++) {
        labels.user_count.push('')
        datum.score.push(this.stu_info.score[stat_idx][i])
      }
      return {
        labels: labels.user_count,
        datasets: [{
          backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(255, 205, 86, 0.2)', 'rgba(255, 99, 132, 0.2)'],
          borderColor: ['rgb(54, 162, 235)', 'rgb(255, 205, 86)', 'rgb(255, 99, 132)'],
          borderWidth: 1,
          data: datum.score
        }]
      }
    },
    // chart.js 그래프 옵션설정
    getChartOptions () {
      return {
        legend: {
          display: false
        },
        scales: {
          xAxes: [{
            display: true,
            ticks: {
              beginAtZero: true,
              steps: 10,
              stepValue: 5
            }
          }]
        }
      }
    }
  }
}
</script>

<style scoped>
.score_wrapper {
    padding: 10px;
    display: grid;
    grid-template-columns: 300px 700px;
    position: relative;
    margin: 0 auto;
    width: 1000px;
}
.sidebar ul {
    position: fixed;
}
.mainbar {
    width: 600px;
}
.mainbar .stat_intro {
    border: 1px solid rgb(215,189,31);
    background: white;
    height: 550px;
    padding: 10px;
}
.mainbar .stat_intro strong{
    display: block;
    font-size: 20px;
    text-align: center;
    padding: 20px;
}
.mainbar .stat_intro .calendar{
    font-size: 15px;
    line-height: 30px;
    display: block;
    margin-left: 60px;
}
.mainbar .stat_intro .intro_introduce {
    font-size: 15px;
    line-height: 25px;
    display: block;
    padding: 5px;
}
.mainbar .stat_intro .intro_desc {
    font-size: 15px;
    line-height: 30px;
    display: block;
    padding: 5px;
    margin-left: 50px;
}
.statistic {
    border: 1px solid rgb(215,189,31);
    border-radius: 5px;
    /* width: 800px; */
    background: white;
    /* text-align: center; */
    font-size: 15px;
     display: block;
    margin : 0 auto;
    font-size: 15px;
    line-height: 23px;
    margin-top: 10px;
    height: 250px;

}
.statistic #title {
  text-align: center;
}
.statistic .left {
  float: left;
}
.statistic .right {
  float: right;
}
.statistic .stat_title {
  font-size: 20px;
  line-height: 30px;
  padding:0;
  text-align: none;
}
.statistic .stat_info {
  font-size: 20px;
  font-weight: bold;
}
.statistic .course_stat{
    display: block;
    border-bottom: 1px solid rgb(215,189,31);
    padding: 15px;
    height: 40px;
}
.statistic .dan_stat_trans{
    display: block;
    padding: 15px;
    line-height: 25px;
}
.stat_chart {
    border: 1px solid rgb(215,189,31);
    border-radius: 5px;
    /* width: 800px; */
    background: white;
    display: block;
    margin : 0 auto;
    padding: 15px;
    margin-top: 10px;
    text-align: center;
}
.stat_desc {
    text-align: center;
    border: 1px solid rgb(215,189,31);
    border-radius: 5px;
    /* width: 785px; */
    background: white;
    display: block;
    margin : 0 auto;
    padding: 15px;
    font-size: 15px;
    line-height: 20px;
    margin-top: 10px;
}
.fomular {
    font-size: 12px;
    color: rgb(10,30,210)
}
#title {
    display: block;
    text-align: center;
    font-size: 20px;
    padding: 10px;
}

ul {
    list-style: none;
    /* margin: 0 auto; */
    padding-left: 0;
}
li {
    border: 1px solid rgb(215,189,31);
    border-radius: 5px;
    padding: 5px;
    margin: 5px;
    background: white;
    width: 250px;
    display: block;
    text-align: center;
    /* margin: 0 auto; */
    margin-top: 5px;
}
li:hover {
    background: rgb(215,189,31);
    color: white;
}
.stat_rank {
    text-align: center;
    border: 1px solid rgb(215,189,31);
    border-radius: 5px;
    /* width: 770px; */
    background: white;
    display: block;
    margin : 0 auto;
    padding: 15px;
    font-size: 15px;
    line-height: 20px;
    margin-top: 10px;
}
.stat_rank ul {
    display: block;
    text-align: center;
}
.stat_rank li {
    background: rgb(215,189,31);
    color: white;
    display: block;
    text-align: center;
    margin: 0 auto;
    margin-top: 5px;
}

</style>
