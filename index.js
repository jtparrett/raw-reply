const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const axios = require('axios')
const cron = require('node-cron')

const hookUrl = 'https://hooks.slack.com/services/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'

const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(bodyParser.json({type: 'application/json'}))

const router = express.Router()

const db = mongoose.createConnection('mongodb+srv://rawnet:ZRigTLXDavfQnjx7@raw-reply-tok2j.mongodb.net/test?retryWrites=true')

const questionsSchema = new mongoose.Schema({
  text: String,
  asked: Boolean
})

const Question = db.model('Questions', questionsSchema)

app.use('/api', router)

router.use('/ask', (req, res) => {
  const text = req.body.text
  const q = new Question({text, asked: false})
  
  q.save(() => {
    res.write(`Your question *"${text}"* has been saved`)
    res.end()
  })
})

router.use('/answer', (req, res) => {
  axios.post(hookUrl, {
    text: `*Anon:* ${req.body.text}`
  })
  res.end()
})

cron.schedule('30 13 * * 3,5', () => {
  Question.findOne().where('asked').equals(false).sort('-_id').then(question => {
    if(!question){
      axios.post(hookUrl, {
        text: "Dang, we're out of questions. Use /ask to submit a new question."
      })
      return 
    }

    axios.post(hookUrl, question).then(() => {
      question.set({ asked: true })
      question.save()
    })
  })
})

cron.schedule('30 13 * * 1', () => {
  axios.post(hookUrl, {
    text: "We always need more questions! Use /ask to submit a new question."
  })
})

app.listen(1202)