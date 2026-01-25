import express from "express"
import bodyParser from "body-parser"
import {registerRoutes} from './infrastructure/http/express'


export function createApp() {
    const app = express();
    app.use(bodyParser.json());
    registerRoutes(app);
    return app;
}