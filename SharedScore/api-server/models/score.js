var mongoose = require("mongoose");
// var config = require('@dankookie/common/config');
// mongo디비를 사용하기위해 모듈을 설치하고 스키마 설계.
const config = {
  YEAR: 2019,
  SEMESTER: 2
};
var Schema = mongoose.Schema;

var scoreSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // lecture: {
  // 	type: Schema.Types.ObjectId,
  // 	ref: 'Lecture',
  // },
  lecture: {
    type: String
  },
  class_no: {
    type: String
  },
  score: {
    type: Number
  },
  course_name: {
    type: String
  },
  take_class_at: {
    year: {
      type: Number,
      default: config.YEAR
    },
    semester: {
      type: String,
      default: config.SEMESTER
    }
  },
  created_at: {
    type: Date,
    default: Date.now,
    update: false
  }
});

scoreSchema.statics.findByUser = function (user) {
  return this.find({
    user
  });
};

mongoose.model("score", scoreSchema);
