"use strict";
import express from "express";

const app = express();
const port = 8080;

app.listen(port, () => console.log("Express listening on port ", port));