"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
const axios_1 = require("axios");
const ACCESS_TOKEN = "EAAFjdqD9bCcBAKFeWTZCjpYDHWMl2iiZAhNmCUFpCBKOu0oTdIGe3VKqazz37CBQSRzSaLnMjMbwlegEsYKus63UsKdct6O1QR2JqAQy22QuPlVCdVXzu5gPJx4Ez0mUTZAWTCctmGy0AOSIzPAHeDW0aXeivAZAagEY7z6UZAgZDZD";
class App {
    constructor() {
        this.express = express();
        this.mountRoutes();
    }
    mountRoutes() {
        const router = express.Router();
        router.get('/isalive', (req, res) => {
            res.json({
                message: 'ServerIsUp'
            });
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
                }
                else {
                    res.sendStatus(403);
                }
            }
        });
        router.post('/webhook', (req, res) => __awaiter(this, void 0, void 0, function* () {
            const body = req.body;
            if (body.object !== 'page') {
                console.log("body.object !== page");
                res.sendStatus(404);
            }
            body.entry.forEach((entry) => __awaiter(this, void 0, void 0, function* () {
                const webhook_event = entry.messaging[0];
                console.log(webhook_event);
                const senderPSID = webhook_event.sender.id;
                if (!!webhook_event.postback && webhook_event.postback.title === "Get Started")
                    App.PSIDToStepID[senderPSID] = "get_desired_item";
                const currentStepId = App.PSIDToStepID[senderPSID];
                const currentStepHendler = App.stepIdToHandler[currentStepId];
                const [nextStepId, responseMessages] = currentStepHendler(webhook_event);
                console.log("Response message", responseMessages);
                console.log("next step id", nextStepId);
                App.PSIDToStepID[senderPSID] = nextStepId;
                responseMessages.forEach((responseMessage) => __awaiter(this, void 0, void 0, function* () { return yield this.sendResponseToMessangerAPI(senderPSID, responseMessage); }));
            }));
            res.status(200).send('EVENT_HANDELED');
        }));
        this.express.use(bodyParser.json());
        this.express.use('/', router);
    }
    sendResponseToMessangerAPI(sender_psid, responseMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const responseObject = {
                "recipient": {
                    "id": sender_psid
                },
                "message": responseMessage
            };
            console.log("Response object", responseObject);
            const url = `https://graph.facebook.com/v2.6/me/messages?access_token=${ACCESS_TOKEN}`;
            try {
                yield axios_1.default.post(url, responseObject);
            }
            catch (error) {
                console.log("An error accured contacting Facebook API");
                console.log(error.message, error);
            }
        });
    }
}
App.PSIDToStepID = {};
App.stepIdToHandler = {
    "get_desired_item": (webhookEvent) => {
        console.log("Getting desired item...");
        return ["get_desired_date", [{
                    "text": "Hey, welcome to Boomerang!"
                },
                {
                    "text": "What would you like to rent?"
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
        console.log("Asking about duration...");
        return ["handle_duration_request",
            {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "button",
                        "text": "Do you know for how long will you need this item?",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "Yes",
                                "payload": "Yes"
                            },
                            {
                                "type": "postback",
                                "title": "No",
                                "payload": "No"
                            }
                        ]
                    }
                }
            }];
    },
    "handle_duration_request": (webhookEvent) => {
        const userResponse = webhookEvent.postback.paylaod;
        if (userResponse === "No")
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
        if (userResponse === "Yes")
            return ["handle_user_duration", [{
                        "text": "Tell us!"
                    }]];
        return ["ask_about_duration", {
                "text": "Unexpected User Response"
            }];
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
        return ["done", {
                "text": "Ok, we’re on it!"
            },
            {
                "text": "We’ll get back to you ASAP :-)"
            }];
    },
    "done": (webhook) => {
        return ["done", []];
    }
};
exports.default = new App().express;
//# sourceMappingURL=App.js.map