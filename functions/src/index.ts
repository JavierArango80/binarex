/* eslint-disable */
Object.defineProperty(exports, "__esModule", {value: true});
exports.getRecipes = exports.sendSMS = void 0;
const functions = require('firebase-functions');
import express = require("express");
import cors = require("cors");
/* eslint-disable */
const twilio = require('twilio');
const accountSid = 'AC6ff6b3a06fd0a81e96c69b450d70496c';
const authToken = '8969c1c5aa17609175bd77f555639a29';
const client = new twilio(accountSid, authToken);
const twilioNumber = '+12134863308';

const app1 = express();
app1.use(cors({ origin: true }));
app1.post('/sendSMS/:phone/:msg', async (req, res) => {
    const phone = '+' + req.params.phone;
    const msg = req.params.msg;
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Allow-Headers', 'Origin');
    res.set('Access-Control-Max-Age', '3600');
    // res.status(204).send('');
    await client.messages
        .create({
        body: msg,
        from: twilioNumber,
        to: phone
    }).then((message) => console.log(message.sid)).done();
    return 'Mensaje enviado';
});
exports.api1 = functions.https.onRequest(app1);

export const twilioSMS = functions.https.onCall((data, context) => {
  const phone = '+' + data.phoneNumber;
  const msg = data.msg;
  console.log(msg);
  client.messages
    .create({
    body: msg,
    from: twilioNumber,
    to: phone
  }).then((message) => console.log(message.sid)).done();
  return { msg: data.msg, date: new Date().getTime() };
});
