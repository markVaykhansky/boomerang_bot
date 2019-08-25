import * as express from 'express'
import * as bodyParser from 'body-parser';
import axios from "axios";

const ACCESS_TOKEN = "EAAFjdqD9bCcBAKFeWTZCjpYDHWMl2iiZAhNmCUFpCBKOu0oTdIGe3VKqazz37CBQSRzSaLnMjMbwlegEsYKus63UsKdct6O1QR2JqAQy22QuPlVCdVXzu5gPJx4Ez0mUTZAWTCctmGy0AOSIzPAHeDW0aXeivAZAagEY7z6UZAgZDZD";

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

class App {
  public express;

  private static PSIDToStepID = {};

  private static stepIdToHandler = {
    "get_desired_item": (webhookEvent) => {
      console.log("Getting desired item...");

      return ["get_desired_date", [{
        "text": "Hey, welcome to Boomerang!\nWhat would you like to rent?"
      }]];
    },
    "get_desired_date": (webhookEvent) => {
      console.log("Getting desired date...");

      return ["ask_about_duration", [{
        "text": "When do you need this item?"
      }, 
      {
        "text": "You can either specify a day of the week or a specific time & date"
      }]];
    },
    "ask_about_duration": (webhookEvent) => {
      return ["handle_duration_request",
      [{
        "attachment":{
          "type":"template",
          "payload":{
            "template_type":"button",
            "text":"Do you know for how long will you need this item?",
            "buttons":[
              {
                "type":"postback",
                "title":"Yes",
                "payload":"Yes"
              },
              {
                "type":"postback",
                "title":"No",
                "payload":"No"
              }
            ]
          }
        }
      }]];
    },
    "handle_duration_request": (webhookEvent) => {
        console.log(webhookEvent);
        console.log(webhookEvent.postback);

        const userResponse = webhookEvent.postback.payload;

        if(userResponse === "No") 
          return ["finish", [
            {
              "text": "Cool, we’ll figure it out as we go"
            },
            {
              "text": "Where would you like us to ship this item?"
            },
            {
              "text": "Please be a specific as possible"
            }
          ]];

        if(userResponse === "Yes") 
          return ["handle_user_duration", [{
            "text": "Tell us!"
          }]];

        return ["ask_about_duration", [{
          "text": "Unexpected User Response"
        }]];
    },
    "handle_user_duration": (webhookEvent) => {
      return ["finish", [
        {
          "text": "Where would you like us to ship this item?"
        },
        {
          "text": "Please be a specific as possible"
        }
      ]];
    },
    "finish": (webhook) => {
      return ["done", [{
        "text": "Ok, we’re on it!"
      },
      {
        "text": "We’ll get back to you ASAP :-)"
      }]];
    },
    "done": (webhook) => {
        return ["done", []];
    }
  }

  constructor () {
    this.express = express();
    this.mountRoutes()
  }

  private mountRoutes (): void {
    const router = express.Router();
    
    router.get('/isalive', (req, res) => {
      res.json({
        message: 'ServerIsUp'
      })
    });

    router.get('/webhook', (req, res) => {
      // Your verify token. Should be a random string.
      let VERIFY_TOKEN = "abcd";
        
      let mode = req.query['hub.mode'];
      let token = req.query['hub.verify_token'];
      let challenge = req.query['hub.challenge'];
        
      if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
          console.log('WEBHOOK_VERIFIED');
          res.status(200).send(challenge);
        } else {
          res.sendStatus(403);      
        }
      }
    });

    router.post('/webhook', async (req, res) => {  
      const body = req.body;

      if (body.object !== 'page') {
        console.log("body.object !== page");
        res.sendStatus(404);
      }

      body.entry.forEach(async (entry) => {
        const webhook_event = entry.messaging[0];
        console.log(webhook_event);
        const senderPSID = webhook_event.sender.id;

        if(!!webhook_event.postback && webhook_event.postback.title === "Get Started") 
          App.PSIDToStepID[senderPSID] = "get_desired_item";

        const currentStepId = App.PSIDToStepID[senderPSID];
        const currentStepHendler = App.stepIdToHandler[currentStepId];

        const [nextStepId, responseMessages] = currentStepHendler(webhook_event);

        console.log("Response message", responseMessages); 
        console.log("next step id", nextStepId);

        App.PSIDToStepID[senderPSID] = nextStepId;
        responseMessages.forEach(async (responseMessage) => {
          await this.sendResponseToMessangerAPI(senderPSID, responseMessage);
          await snooze(1000);
        });
      });

      res.status(200).send('EVENT_HANDELED');
    });

    this.express.use(bodyParser.json());
    this.express.use('/', router)
  }

  private async sendResponseToMessangerAPI(sender_psid: string, responseMessage) {
    const responseObject = {
      "recipient": {
        "id": sender_psid
      },
      "message": responseMessage
    }
    console.log("Response object", responseObject);

    const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${ACCESS_TOKEN}`

    try {
      await axios.post(url, responseObject);
    }
    catch(error){ 
      console.log("An error accured contacting Facebook API");
      console.log(error.message, error);
    }
  }
}

export default new App().express