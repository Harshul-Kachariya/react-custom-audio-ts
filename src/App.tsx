import React from "react";
import AudioPlayer from "./components/AudioPlayer";

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen justify-center items-center">
      <AudioPlayer />
    </div>
  );
};

export default App;
