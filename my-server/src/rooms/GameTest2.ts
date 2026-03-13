import { Room, Client, CloseCode } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

class Player extends Schema {
  @type("string") name: string = "NO NAME";
  constructor(options?: any) {
    super();
    if (options && options.name) {
      this.name = options.name;
    }
  }
}

class ChatData extends Schema {
  @type("string") senderId: string;
  @type("string") name: string;
  @type("string") message: string;
  @type("number") createdAt: number;
}

export class GameTest2State extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([ ChatData ]) chatHistory = new ArraySchema<ChatData>();
}

export class GameTest2Room extends Room {
  static readonly CHAT_MAX_LENGTH: number = 10;
  state = new GameTest2State();

  sendMessage (message: ChatData)  {
    this.state.chatHistory.push(message);
    console.log(message.name + ": " + message.message);
    while (this.state.chatHistory.length > GameTest2Room.CHAT_MAX_LENGTH) {
      this.state.chatHistory.shift();
    }
  }
  
  onCreate (options: any) {    
    // 名前変更
    this.onMessage("change_name", (client: Client, data: string) => {
      const player = this.state.players.get(client.sessionId);
      const chatMessage: ChatData = new ChatData({
        senderId: "",
        name: "",
        message: player.name + "が" + data + "に名前変更しました",
        createdAt: Date.now()
      });
      player.name = data;
      this.sendMessage(chatMessage);
    });

    // 発言
    this.onMessage("chat", (client: Client, data: string) => {
      const playerName: string = this.state.players.get(client.sessionId).name;
      const chatMessage: ChatData = new ChatData({
        senderId: client.sessionId,
        name: playerName,
        message: data,
        createdAt: Date.now()
      });
      this.sendMessage(chatMessage);
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player({ name: options.name }));
    console.log(this.state.players.get(client.sessionId));
      
    const chatMessage: ChatData = new ChatData({
      senderId: "",
      name: "",
      message: options.name + "が入室しました。",
      createdAt: Date.now()
    });

    this.sendMessage(chatMessage);
  }

  onLeave (client: Client, code: CloseCode) {
    const chatMessage: ChatData = new ChatData({
      senderId: "",
      name: "",
      message: this.state.players.get(client.sessionId).name + "が退室しました。",
      createdAt: Date.now()
    });

    console.log(client.sessionId, "left!", code);
    this.state.players.delete(client.sessionId);

    this.sendMessage(chatMessage);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
