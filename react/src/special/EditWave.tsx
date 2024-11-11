import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress } from "@mui/material";
import * as Tone from "tone";
import { useRef, useEffect, useState } from "react";

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import path from "path";

export type EditWaveProps = {
  url: string;
  title: string;
  channel: string;
};

/****************************************************************
 * AudioBuffer を Blob に変換
 ****************************************************************/
const makeWav = (src: AudioBuffer | Tone.ToneAudioBuffer) => {
  const numOfChan = src.numberOfChannels;
  const length = src.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);

  const setUint16 = (view: DataView, offset: number, data: number) => {
    view.setUint16(offset, data, true);
    return offset + 2;
  };

  const setUint32 = (view: DataView, offset: number, data: number) => {
    view.setUint32(offset, data, true);
    return offset + 4;
  };

  const writeString = (view: DataView, offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    return offset + str.length;
  };

  // WAVEファイルのヘッダー作成
  let pos = 0;
  const view = new DataView(buffer);
  pos = writeString(view, pos, "RIFF"); // "RIFF"
  pos = setUint32(view, pos, length - 8); // file length - 8
  pos = writeString(view, pos, "WAVE"); // "WAVE"

  pos = writeString(view, pos, "fmt "); // "fmt " chunk
  pos = setUint32(view, pos, 16); // length = 16
  pos = setUint16(view, pos, 1); // PCM (uncompressed)
  pos = setUint16(view, pos, numOfChan);
  pos = setUint32(view, pos, src.sampleRate);
  pos = setUint32(view, pos, src.sampleRate * 2 * numOfChan); // avg. bytes/sec
  pos = setUint16(view, pos, numOfChan * 2); // block-align
  pos = setUint16(view, pos, 16); // 16-bit

  pos = writeString(view, pos, "data"); // "data" - chunk
  pos = setUint32(view, pos, length - pos - 4); // chunk length

  // write interleaved data
  const channels = [];
  for (let i = 0; i < src.numberOfChannels; i++) channels.push(src.getChannelData(i));

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      // 波形の再生位置ごとに左右のチャンネルのデータを設定していく
      const sample = Math.max(-1, Math.min(1, (channels[i] ?? [])[offset] ?? 0)); // 波形データを-1~1の間に丸め込む(おそらく最大最小を求め、全区間をその数で割って正規化するのが良いかも)
      const sample16bit = (0.5 + sample < 0 ? sample * 0x8000 : sample * 0x7fff) | 0; // 32bit不動小数点を16bit整数に丸め込む
      view.setInt16(pos, sample16bit, true); // データ書き込み
      pos += 2;
    }
    offset++;
  }

  return new Blob([buffer], { type: "audio/wav" });
};

/****************************************************************
 * 波形編集コントロール
 ****************************************************************/
export const EditWave = ({ url, title, channel }: EditWaveProps) => {
  const [loop, setLoop] = useState(false);

  // const url = URL_RES + channel + "/" + filename;
  // const url = "http://localhost:3000/res/" + channel + "/" + filename;

  // url = "http://localhost:3000/res/maru/03ari.mp3";
  url = "http://localhost:3000/raw/nagisa/4a3d654d-7a7a-422e-95a1-1c3f7c51413e_0vqOUZzHYlw-1221-1231.wav";

  const masterBuffer = new Tone.ToneAudioBuffer(url, () => {
    console.log("loaded");
    // 読み込んだら再生コントロールに紐づけ
    player.buffer.set(masterBuffer);

    waveformRef.current.load(url);
  });

  const player = new Tone.Player().toDestination();

  Tone.loaded().then(() => {
    console.log("tone load ok");
  });

  const waveformRef = useRef<any>(null);

  // 範囲選択プラグイン
  const regions = RegionsPlugin.create();

  let activeRegion: any = null;
  let activeRegionClickTime: any = null;

  useEffect(() => {
    // wavesurfer.jsがオーディオファイルをコントロールするためのオブジェクトを作成
    // waveformRef.currentに入れる
    waveformRef.current = WaveSurfer.create({
      container: waveformRef.current,
      plugins: [regions],
    });
    waveformRef.current.on("decode", () => {
      activeRegion = regions.addRegion({
        start: 0,
        end: 1,
        content: "切り抜き範囲",
        color: "rgba(255, 200,0, 0.2)",
        drag: true,
        resize: true,
      });
    });

    // regions.enableDragSelection({
    //   color: "rgba(255, 0, 0, 0.1)",
    // });

    regions.on("region-updated", (region) => {
      console.log("Updated region", region);
    });

    regions.on("region-in", (region) => {
      console.log("region-in", region);
      activeRegion = region;
    });
    regions.on("region-out", (region) => {
      console.log("region-out", region);
      if (activeRegion === region) {
        const sub = Date.now() - activeRegionClickTime;
        if (sub > 100) {
          // 0.1秒以上
          // region.play();
          waveformRef.current.pause();
        }
      }
    });
    regions.on("region-clicked", (region, e) => {
      e.stopPropagation(); // prevent triggering a click on the waveform
      region.play();
      activeRegion = region;
      activeRegionClickTime = Date.now();

      // region.setOptions({ color: randomColor() });
    });
    // Reset the active region when the user clicks anywhere in the waveform
    waveformRef.current.on("interaction", () => {
      activeRegion = null;
    });
  }, []);

  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`;

  return (
    <>
      {/* 波形表示 */}
      <Box ref={waveformRef} sx={{ width: "500px" }}></Box>

      <Button
        variant="contained"
        onMouseUp={() => {
          activeRegion.play();
          activeRegionClickTime = Date.now();

          // waveformRef.current.play();
          // player.start();
          // player.onstop = async () => {
          //   console.log("player1 stopped");
          // };
        }}
        sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}
      >
        再生
      </Button>

      {/* <Button
        variant="contained"
        onMouseUp={() => {
          const buffer = masterBuffer.slice(0.95, 2.0);
          player.buffer.set(buffer);
        }}
        sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}
      >
        トリミング
      </Button> */}

      <Button
        variant="contained"
        onMouseUp={() => {
          const buffer = player.buffer.get();
          if (typeof buffer !== "undefined") {
            const tmpFileUrl = URL.createObjectURL(makeWav(buffer));

            // wavファイルで保存
            // const name = filename.split(".").slice(0, -1).join(".");
            // URLからファイル名を生成
            // const name = path.basename(url);
            const name = url;

            const anchor = document.createElement("a");
            anchor.download = name + ".wav";
            anchor.href = tmpFileUrl;
            anchor.click();
          }
        }}
        sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}
      >
        保存
      </Button>
    </>
  );
};
