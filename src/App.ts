import * as express from 'express'
import * as bodyParser from 'body-parser';
import axios from "axios";

const ACCESS_TOKEN = "EAAFjdqD9bCcBAKFeWTZCjpYDHWMl2iiZAhNmCUFpCBKOu0oTdIGe3VKqazz37CBQSRzSaLnMjMbwlegEsYKus63UsKdct6O1QR2JqAQy22QuPlVCdVXzu5gPJx4Ez0mUTZAWTCctmGy0AOSIzPAHeDW0aXeivAZAagEY7z6UZAgZDZD";

class App {
  public express;

  private static PSIDToStepID = {};

  private static stepIdToHandler = {
    "welcome": (webhookEvent) => {
      return ["get_desired_item", {
        "text": "Hey, welcome to Boomerang! What would you like to rent?"
      }];
    },
    "get_desired_item": (webhookEvent) => {
      return ["get_desired_item", {
        "text": "When do you need this item? You can either specify a day of the week or a specific time & date."
      }];
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
        const senderPSID = webhook_event.sender.id;
        
        console.log('Sender PSID: ' + webhook_event.sender.id);
        console.log(webhook_event);

        if(webhook_event.postback.title === "Get Started") {
          console.log("Get started recieved");
          App.PSIDToStepID[senderPSID] = "welcome";
        }

        const currentStepId = App.PSIDToStepID[senderPSID];
        const currentStepHendler = App.stepIdToHandler[currentStepId];

        const [nextStepId, responseMessage] = currentStepHendler(webhook_event);

        console.log("Response message", responseMessage); 
        console.log("next step id", nextStepId);

        App.PSIDToStepID[senderPSID] = nextStepId;
        await this.sendResponseToMessangerAPI(senderPSID, responseMessage);
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