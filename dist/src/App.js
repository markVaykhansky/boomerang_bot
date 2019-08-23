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
            if (body.object !== 'page')
                res.sendStatus(404);
            body.entry.forEach((entry) => __awaiter(this, void 0, void 0, function* () {
                const webhook_event = entry.messaging[0];
                const senderPSID = webhook_event.sender.id;
                console.log('Sender PSID: ' + webhook_event.sender.id);
                console.log(webhook_event);
                if (webhook_event.message) {
                    const responseMessage = this.handleMessage(webhook_event.message);
                    console.log("Response message", responseMessage);
                    yield this.sendResponseToMessangerAPI(senderPSID, responseMessage);
                }
                ;
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
            console.log("Url: " + url);
            try {
                yield axios_1.default.post(url, responseObject);
            }
            catch (error) {
                console.log("An error accured contacting Facebook API");
                console.log(error.message, error);
            }
        });
    }
    handleMessage(received_message) {
        if (received_message.text) {
            return {
                "text": `You sent the message: "${received_message.text}"`
            };
        }
        else {
            return {
                "text": "You sent an empty message"
            };
        }
    }
}
exports.default = new App().express;
//# sourceMappingURL=App.js.map