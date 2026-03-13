import { useEffect, useState, useRef } from 'react'
import { Client, Room, Callbacks } from '@colyseus/sdk'

interface PlayerData {
  x: number;
  y: number;
}

const endpoint = import.meta.env.VITE_SERVER_URL;
const client = new Client(endpoint);

function Game1() {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [players, setPlayers] = useState<{ [id: string]: PlayerData }>({});
  const [inputPass, setInputPass] = useState<string>("");

  const roomRef = useRef<Room | null>(null);

  const connect = async (userPasscode: string) => {
    try {
      roomRef.current?.leave();

      roomRef.current = null;

      const activeRoom = await client.joinOrCreate("gametest_1_room", {
        passcode: userPasscode
      });

      roomRef.current = activeRoom;

      const callbacks = Callbacks.get(activeRoom);
      setRoom(activeRoom);
      setRoomName(userPasscode);
      setPlayers(() => ({}));

      // プレイヤー追加
      callbacks.onAdd("players", (player: any, key: any) => {
        const sessionId = key as string;
        console.log(player, "has been added at", sessionId);
        setPlayers((prev) => ({
          ...prev,
          [sessionId]: { x: player.x, y: player.y }
        }));
        
        // プレイヤーの状態変更
        callbacks.onChange(player, () => {
          console.log(player, "has moved ", sessionId);
          setPlayers((prev) => ({
            ...prev,
            [sessionId]: {
              x: player.x,
              y: player.y
            }
          }));
        });
      });

      // プレイヤー削除
      callbacks.onRemove("players", (_player: any, key: any) => {
        const sessionId = key as string;
        setPlayers((prev) => {
          const newState = { ...prev };
          delete newState[sessionId];
          return newState;
        });
      });

    } catch (e) {
      console.error("失敗", e);
    }

  };

  useEffect(() => {
    // マウス移動
    const handleMouseMove = (e: MouseEvent) => {
      if (roomRef.current) {
        roomRef.current.send("move", { x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    // ログアウト
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      roomRef.current?.leave();
    };
  }, []);


  return (
    <div className="relative w-screen h-screen bg-slate-900 overflow-hidden"> 
      
      <div className="flex gap-2 p-4">
        <input 
          className="text-white p-2 border"
          value={inputPass} 
          onChange={(e) => setInputPass(e.target.value)} 
          placeholder="合言葉を入力"
        />
        <button onClick={() => connect(inputPass)} className="bg-blue-500 p-2 text-white">
          接続
        </button>
      </div>

      <div className="absolute top-4 left-4 text-white font-mono bg-black/50 p-2 rounded z-20">
        接続状況: {room ? "✅ Connected" : "❌ Disconnected"} <br />
        ルーム名: {roomName !== null ? roomName: "None"} <br />
        プレイヤー数: {Object.keys(players).length}
      </div>

      {Object.entries(players).map(([id, pos]) => (
        <div
          key={id}
          className={`absolute top-0 left-0 w-8 h-8 rounded-full border-2 border-white text-white transition-transform duration-75 ease-linear
            ${id === room?.sessionId ? 'bg-blue-500 z-10' : 'bg-red-500'}`}
          style={{
            transform: `translate(${pos.x - 16}px, ${pos.y - 16}px)`,
          }}
        >

          <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-white whitespace-nowrap">
            {id === room?.sessionId ? "You" : id.substring(0, 5)}
          </span>

        </div>
      ))}
    </div>
  );

}

export default Game1
