import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress } from "@mui/material";
import useSound from "use-sound";
import { URL_RES } from "../const";
import * as Tone from "tone";
import { start } from "repl";

export type EditWaveProps = {
  filename: string;
  title: string;
  channel: string;
};

// const floatTo16BitPCM = (output, offset, input) =>{
//   for (let i = 0; i < input.length; i++, offset += 2) {
//     let s = Math.max(-1, Math.min(1, input[i]))
//     output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
//   }
// }

export const EditWave = ({ filename, title, channel }: EditWaveProps) => {
  const url = URL_RES + channel + "/" + filename;
  const dest = Tone.context.createMediaStreamDestination();
  const recorder = new MediaRecorder(dest.stream, {
    mimeType: "audio/webm codecs=opus",
    audioBitsPerSecond: 128000, // 128kbps ただしエンコードモードがvbsになるので64kbpsになる（収まるから？）
  });
  const chunks: any[] = [];
  recorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };
  recorder.onstop = () => {
    //chromeのブラウザのデフォのコーデックがopusなのでそのまま使ってます
    // const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
    const blob = new Blob(chunks, { type: "audio/webm codecs=opus" });

    const file_url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = "recording.webm";
    anchor.href = file_url;
    anchor.click();
  };

  const masterBuffer = new Tone.ToneAudioBuffer("http://localhost:3000/res/maru/03ari.mp3", () => {
    console.log("loaded");
    const buffer = masterBuffer.slice(0.95, 2.0);
    player.buffer.set(buffer);

    // const ary1 = buffer.toArray(0);
    // const ary2 = buffer.toArray(1);
  });

  const player = new Tone.Player().toDestination();
  player.connect(dest);

  Tone.loaded().then(() => {
    console.log("tone load ok");
  });

  return (
    <Button
      variant="contained"
      onMouseUp={() => {
        recorder.start();
        player.start();
        player.onstop = async () => {
          console.log("player1 stopped");
          const recording = await recorder.stop();
          // const url = URL.createObjectURL(recording);
          // const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });

          // const anchor = document.createElement("a");
          // anchor.download = "recording.webm";
          // anchor.href = url;
          // anchor.click();
        };

        // console.log(buffer.length);
      }}
      sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}
    >
      {title}
    </Button>
  );
};
