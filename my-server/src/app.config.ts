import cors from "cors";

import {
    defineServer,
    defineRoom,
    monitor,
    playground,
    createRouter,
    createEndpoint,
} from "colyseus";

/**
 * Import your Room files
 */
import { GameTest1Room } from "./rooms/GameTest1.js";
import { GameTest2Room } from "./rooms/GameTest2.js";
import { GameTest3Room } from "./rooms/GameTest3.js";


const server = defineServer({
    /**
     * Define your room handlers:
     */
    rooms: {
        gametest_1_room: defineRoom(GameTest1Room).filterBy(['passcode']),
        gametest_2_room: defineRoom(GameTest2Room).filterBy(['passcode']),
        gametest_3_room: defineRoom(GameTest3Room).filterBy(['passcode'])
    },

    /**
     * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
     * 
     * Usage from SDK: 
     *   client.http.get("/api/hello").then((response) => {})
     * 
     */
    routes: createRouter({
        api_hello: createEndpoint("/api/hello", { method: "GET", }, async (ctx) => {
            return { message: "Hello World" }
        })
    }),

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    express: (app) => {

        app.use(cors({ origin: process.env.CLIENT_URL }));
        
        app.get("/hi", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitoring/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor_" + process.env.MONITOR_PATH, monitor());

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }
    }

});

export default server;