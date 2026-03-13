import { useState, useRef, useEffect } from 'react'
import { Client, Room, Callbacks } from '@colyseus/sdk'

const client = new Client("ws://localhost:2567");

interface ChatMessage {
  senderId: string;
  name: string;
  message: string;
  createdAt: number;
}

export function ChatDisplay({ chatHistory }: { chatHistory: Array<ChatMessage> }) {



  return ( 
    <div className="flex flex-col-reverse w-full h-64 bg-black/30 rounded-lg p-4 overflow-y-auto border border-white/10 custom-scrollbar">
      {[...chatHistory].reverse().map((chat, index) => (
        <div 
          key={index} 
          className="mb-2 last:mb-0 animate-fadeIn select-text" // select-text で確実にコピー可能に
        > 
          <span className="block text-[10px] text-gray-500">
            {new Date(chat.createdAt).toLocaleTimeString()}&nbsp;
          </span>
          <span className="text-blue-400 font-bold mr-2">[{chat.name}]&nbsp;</span>
          <span className="text-white break-words">{chat.message}</span>

        </div>
      ))}

      {chatHistory.length === 0 && (
        <p className="">まだメッセージはありません</p>
      )}
    </div>
  );
}

function Game2() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ [id: string]: string }>({});
  const [messageData, setMessageData] = useState<Array<ChatMessage>>([]);

  const [inputPass, setInputPass] = useState<string>("114514");
  const [inputName, setInputName] = useState<string>("野　獣　先　輩");
  const [inputMessage, setInputMessage] = useState<string>("");

  const roomRef = useRef<Room | null>(null);

  const connect = async (userPasscode: string) => {
    try {
      roomRef.current?.leave();
      roomRef.current = null;

      const activeRoom = await client.joinOrCreate("gametest_2_room", {
        passcode: userPasscode,
        name: inputName
      });

      roomRef.current = activeRoom;

      const callbacks = Callbacks.get(activeRoom);

      setRoom(activeRoom);
      setRoomName(userPasscode);
      setPlayers(() => ({}));

      setMessageData([]);

      // プレイヤー追加
      callbacks.onAdd("players", (player: any, sessionId: string) => {
        setPlayers((prev) => ({
          ...prev,
          [sessionId]: player.name
        }));
        
        callbacks.onChange(player, () => {
          setPlayers((prev) => ({
            ...prev,
            [sessionId]: player.name
          }));
        });
      });

      // プレイヤー削除
      callbacks.onRemove("players", (player: any, sessionId: string) => {
        setPlayers((prev) => {
          const newState = { ...prev };
          delete newState[sessionId];
          return newState;
        });
      });

      
      callbacks.onAdd("chatHistory", (data: any, index: number) => {
        console.log("GET NEW");
        setMessageData([...activeRoom.state.chatHistory.toArray()]);

        callbacks.onChange(data, () => {
          console.log("GET CHANGE");
          setMessageData([...activeRoom.state.chatHistory.toArray()]);
        });
      });

      callbacks.onRemove("chatHistory", (data: any, index: number) => {
        console.log("GET DEL");
        setMessageData([...activeRoom.state.chatHistory.toArray()]);
      });

    } catch (e) {
      console.error("connect 失敗", e);
    }

  };

  const changeName = (userName: string) => {
    try {
      if (roomRef.current) {
        roomRef.current.send("change_name", userName);
      }
    } catch (e) {
      console.error("changeName 失敗", e);
    }
  };

  const sendMessage = (message: string) => {
    if (message === "") {
      return;
    }

    try {
      if (roomRef.current) {
        roomRef.current.send("chat", message);
      }
    } catch (e) {
      console.error("sendMessage 失敗", e);
    }
  };


  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden"> 
      
      <p>部屋名を入力！</p>

      <div className="flex gap-2 p-4">
        <input 
          className="text-white p-2 border"
          value={inputPass} 
          onChange={(e) => setInputPass(e.target.value)} 
        />
        <button onClick={() => connect(inputPass)} className="bg-blue-500 p-2 text-white">
          接続
        </button>
      </div>

      <p>名前を入力！</p>
      
      <div className="flex gap-2 p-4">
        <input 
          className="text-white p-2 border"
          value={inputName} 
          onChange={(e) => setInputName(e.target.value)} 
        />
        <button onClick={() => changeName(inputName)} className="bg-blue-500 p-2 text-white">
          変更
        </button>
      </div>

      <p>発言しよう！</p>
      
      <div className="flex gap-2 p-4">
        <input 
          className="text-white p-2 border"
          value={inputMessage} 
          onChange={(e) => setInputMessage(e.target.value)} 
        />
        <button onClick={() => sendMessage(inputMessage)} className="bg-blue-500 p-2 text-white">
          発言
        </button>
      </div> 

      <div className="absolute top-4 left-4 text-white font-mono bg-black/50 p-2 rounded z-20">
        接続状況: {room ? "✅ Connected" : "❌ Disconnected"} <br />
        ルーム名: {roomName !== null ? roomName: "None"} <br />
        プレイヤー数: {Object.keys(players).length} <br />
      </div>

      <div> 参加者一覧：
        {Object.entries(players).map(([id, name]) => (
          <div
            key={id}
          >
            {name}
          </div>
        ))}

        <br/>
      </div>

      <ChatDisplay chatHistory={messageData} />
      
    </div>
  );

}

export default Game2