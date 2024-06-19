import React from "react";
import AudioPlayer from "./components/AudioPlayer";
import sample from "../public/sample2.mp3";

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <AudioPlayer />
    </div>
  );
};

export default App;
