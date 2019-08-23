"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const App_1 = require("./src/App");
const envPort = process.env.PORT;
if (envPort)
    console.log("env port: " + envPort);
const port = envPort || 4000;
App_1.default.listen(port, (err) => {
    if (err) {
        return console.log(err);
    }
    return console.log(`server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map