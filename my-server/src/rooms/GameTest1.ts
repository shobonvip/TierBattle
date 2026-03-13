import { Room, Client, CloseCode } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

export class GameTest1State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameTest1Room extends Room {
  state = new GameTest1State();
  
  onCreate (options: any) {    
    this.onMessage("move", (client: Client, data: Player) => {
      const player = this.state.players.get(client.sessionId);
      player.x = data.x;
      player.y = data.y;
    })
  }

  onJoin (client: Client) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave (client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
