/*

  TIER BATTLE (制作途中！)

  各プレイヤーがお題を出し合い、お題に対する解答を 3 つ用意する。より「強い」解答を作った人が勝ち。

  Phase 0: ロビー
    ゲーム開始前。ゲーム開始をすると、Phase 1 に移行する。
  
  Phase 1: お題を出す
    各プレイヤーはお題を 1 問出す。

  Phase 2: お題に対して解答
    各プレイヤーは表示されているお題に対して解答を 3 つ作る。
    - 解答が被ってはならない。この場合、均等に点数が分配されるが、当然その分点数が減る。
    - 解答が 2 つ以下は許容されるが、その分の点数しかもらえないので不利。
  
  Phase 3: 解答を採点
    各プレイヤーは表示される解答の「強さ」を 0～100 で採点する。

  Phase 4: 結果表示 
    各プレイヤーの採点は平均が 60、標準偏差は 20 に標準化される。
    各プレイヤーの解答の点数は、「他プレイヤーからの採点における点数の平均」として定まる。
    この値によって TIER ランクが決まる。
    提出した 3 つの解答の点数の合計がプレイヤーの点数に加算される。

  Phase 5: ゲームリザルト
    「プレイヤーの解答の点数」/ 3*(ステージ数) によってその人の TIER が定まる。
    あなたが解答の格付けをするとき、あなたもまた格付けされているのだ。

*/

import { Room, Client, CloseCode } from "colyseus";
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { ChatData } from "./GameTest2.js";

class Player extends Schema {
  @type("string") name = "NO NAME";
  @type("number") point = 0; // 点数
//  @type("string") theme = "自由に記入してください"; // input in P0
//  @type([ String ]) answers = new ArraySchema<String>(); // input in P1
//  @type({ map: Number }) scoreForAnswers = new MapSchema<Number>(); // input in P2

  constructor(options?: any) {
    super();
    if (options && options.name) {
      this.name = options.name;
    }
  }
}

export class GameTest3State extends Schema {
  // プレイヤーの map
  @type({ map: Player }) players = new MapSchema<Player>();
  // チャット履歴
  @type([ ChatData ]) chatHistory = new ArraySchema<ChatData>();

  // 解答をすべて集めた配列
//  @type([ String ]) allAnswers = new ArraySchema<String>();
  // 人に対する解答
//  @type({ map: [ String ] }) answersForPeople = new MapSchema<ArraySchema<String>>();

  /*
    Phase
      0 ... Lobby.
      1 ... Game Start, players input themes.
      2 ... The theme displays, players input their answers.
      3 ... The answers display, players votes score.
      4 ... Result time! Players' score change.
      5 ... Game end, total result.
  */
  @type("string") adminSessionId = "";
  @type("number") phase = 0;
  @type("number") remainingTime = 0;
//  @type("string") themeSessionId = "";
}


export class GameTest3Room extends Room {
  static readonly CHAT_MAX_LENGTH: number = 100;
  static readonly MESSAGE_MAX_LENGTH: number = 300;
  static readonly NAME_MAX_LENGTH: number = 100;

  static readonly PHASE_1_TIME: number = 3;
  static readonly PHASE_5_TIME: number = 2;
  
  state = new GameTest3State();

  // メッセージ送信処理
  sendMessage (message: ChatData)  {
    if (message.message.length > GameTest3Room.MESSAGE_MAX_LENGTH) {
      message.message = message.message.slice(0, GameTest3Room.MESSAGE_MAX_LENGTH);
    }
    this.state.chatHistory.push(message);
    console.log(message.name + ": " + message.message);
    while (this.state.chatHistory.length > GameTest3Room.CHAT_MAX_LENGTH) {
      this.state.chatHistory.shift();
    }
  }

  // phase 0
  // 初期化とかやろう
  phaseZeroEvent() {
    console.log("PHASE 0");
    this.state.phase = 0;
    this.state.remainingTime = 0;
    this.state.players.forEach((player, _sessionId) => {
      player.point = 0;
    });
  }

  // phase 1
  phaseOneEvent () { 
    console.log("PHASE 1");
    this.state.phase = 1;
    this.state.remainingTime = GameTest3Room.PHASE_1_TIME;

    const interval = this.clock.setInterval(() => {
      if (
        this.state.remainingTime <= 0
        || this.state.phase !== 1
      )  {
        interval.clear();
        this.phaseFiveEvent();
      }
      
      this.state.players.forEach((player, _sessionId) => {
        player.point += Math.floor(Math.random() * 100);
      });

      this.state.remainingTime -= 1;
    }, 1000);
  }

  // phase 5
  // 結果表示
  phaseFiveEvent () { 
    console.log("PHASE 5");
    this.state.phase = 5;
    this.state.remainingTime = GameTest3Room.PHASE_5_TIME;

    const interval = this.clock.setInterval(() => {
      if (
        this.state.remainingTime <= 0
        || this.state.phase !== 5
      )  {
        interval.clear();
        this.phaseZeroEvent();
      }

      this.state.remainingTime -= 1;
    }, 1000);
  }

  // ゲームスタートを処理しようとする
  gameStart () {
    if (this.state.phase !== 0) {
      return;
    }
    if (this.state.players.size <= 1) {
      return;
    }
    this.phaseOneEvent();
  }
  
  // ルーム作成
  onCreate (options: any) {    

    // 名前変更
    this.onMessage("change_name", (client: Client, data: string) => {
      if (data.length > GameTest3Room.NAME_MAX_LENGTH) {
        data = data.slice(0, GameTest3Room.NAME_MAX_LENGTH);
      }
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

    // ゲームスタート
    this.onMessage("game_start", (client: Client) => {
      if (client.sessionId !== this.state.adminSessionId) {
        console.log("gameStart failed, because it was not from admin!")
        return;
      }
      if (this.state.phase !== 0) {
        console.log("gameStart failed, because game already started!")
        return;
      }
      if (this.state.players.size <= 1) {
        console.log("gameStart failed, because only one player!")
        return;
      }
      this.gameStart();
    });
  }

  // 参加
  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player({ name: options.name }));

    // admin がいない場合、自分が admin になる
    if (this.state.adminSessionId === "") {
      console.log("admin changed to " + client.sessionId);
      this.state.adminSessionId = client.sessionId;
    }

    const chatMessage: ChatData = new ChatData({
      senderId: "",
      name: "",
      message: options.name + "が入室しました。",
      createdAt: Date.now()
    });

    this.sendMessage(chatMessage);
  }

  // 退室
  onLeave (client: Client, code: CloseCode) {
    const playerName = this.state.players.get(client.sessionId).name
    this.state.players.delete(client.sessionId);

    // admin が退室した場合、入室している人の一人を admin にする
    if (this.state.adminSessionId === client.sessionId) {
      if (this.state.players.size == 0) {
        this.state.adminSessionId = "";
      } else {
        const firstEntry = this.state.players.entries().next().value;
        this.state.adminSessionId = firstEntry[0];
      }
    }

    const chatMessage: ChatData = new ChatData({
      senderId: "",
      name: "",
      message: playerName + "が退室しました。",
      createdAt: Date.now()
    });
    console.log(client.sessionId, "left!", code);
    this.sendMessage(chatMessage);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
