"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
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
        router.post('/webhook', (req, res) => {
            const body = req.body;
            if (body.object === 'page') {
                // Iterates over each entry - there may be multiple if batched
                body.entry.forEach(function (entry) {
                    // Gets the message. entry.messaging is an array, but 
                    // will only ever contain one message, so we get index 0
                    let webhook_event = entry.messaging[0];
                    console.log(webhook_event);
                });
                res.status(200).send('EVENT_RECEIVED');
            }
            else {
                res.sendStatus(404);
            }
        });
        // this.express.use(function(req, res, next) {
        //   res.header("Access-Control-Allow-Origin", "*");
        //   res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
        //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        //   next();
        // });
        this.express.use(bodyParser.json());
        this.express.use('/', router);
    }
}
exports.default = new App().express;
//# sourceMappingURL=App.js.map