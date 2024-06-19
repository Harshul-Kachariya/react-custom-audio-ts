import React from "react";
import AudioPlayer from "./components/AudioPlayer";
import sample from "../public/sample2.mp3";

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <AudioPlayer
        audioUrl={
          "https://cdn.jewelpro.app/orders/7543fbd5-308b-4887-b7f5-b03e416bfe3d/2d2bcac8-2342-438f-8336-d8f066ab6234.mp3"
        }
      />
    </div>
  );
};

export default App;
