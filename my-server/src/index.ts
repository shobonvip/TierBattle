/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting, you can see "Raw usage" from the documentation.
 * 
 * See: https://docs.colyseus.io/server
 */

import { listen } from "@colyseus/tools";
import { Client } from "@colyseus/sdk";
import type { server } from "./app.config.ts";

const client = new Client<typeof server>("http://localhost:2567");

import app from "./app.config.js";
listen(app);
