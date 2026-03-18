import express from "express"
import bodyParser from "body-parser"
import {registerRoutes} from './infrastructure/http/express'


export function createApp() {
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }))
    registerRoutes(app);
    return app;
}