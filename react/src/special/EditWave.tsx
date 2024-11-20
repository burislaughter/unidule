import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress } from "@mui/material";
import * as Tone from "tone";
import { useRef, useEffect, useState } from "react";

import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions";
import { makeWav } from "../const";

export type EditWaveProps = {
  url: string;
  setBuffer: any;
  setRange: any;
};

/****************************************************************
 * 波形編集コントロール
 ****************************************************************/
export const EditWave = ({ url, setBuffer, setRange }: EditWaveProps) => {
  // const [activeRegion, setActiveRegion] = useState<any>();
  // const [activeRegionClickTime, setActiveRegionClickTime] = useState<number>(0);

  const waveformRef = useRef<any>(null);
  const activeRegion = useRef<any>(null);
  const activeRegionClickTime = useRef<any>(null);
  const playState = useRef<boolean>(false);

  const [fixState, setFixState] = useState<boolean>(false);

  const masterBuffer = new Tone.ToneAudioBuffer(url, () => {
    console.log("loaded");
    // 読み込んだら再生コントロールに紐づけ
    player.buffer.set(masterBuffer);

    setBuffer(player.buffer);
    waveformRef.current.load(url);
  });

  const player = new Tone.Player().toDestination();

  Tone.loaded().then(() => {
    console.log("tone load ok");
  });

  // 範囲選択プラグイン
  const regions = RegionsPlugin.create();

  useEffect(() => {
    // wavesurfer.jsがオーディオファイルをコントロールするためのオブジェクトを作成
    waveformRef.current = WaveSurfer.create({
      container: waveformRef.current,
      plugins: [regions],
    });
    waveformRef.current.on("decode", (duration: number) => {
      if (regions?.getRegions().length != 0) {
        regions.clearRegions();
      }

      // 初期選択範囲を一つだけ作成
      const reg = regions.addRegion({
        start: duration * 0.05,
        end: duration - duration * 0.05,
        content: "切り抜き範囲",
        color: "rgba(255, 200,0, 0.2)",
        drag: false,
        resize: true,
      });
      activeRegion.current = reg;

      // 範囲情報保持
      setRange(reg);
    });

    // 範囲更新
    regions.on("region-updated", (region) => {
      console.log("範囲更新", region);
      // setFixState(false);
      setRange(region);
    });

    regions.on("region-in", (region) => {
      console.log("region-in", region);
      playState.current = true;
    });

    regions.on("region-out", (region) => {
      console.log("region-out", region);
      if (activeRegion.current === region) {
        const sub = Date.now() - activeRegionClickTime.current;
        if (sub > 100) {
          // 0.1秒以上
          waveformRef.current.pause();
          playState.current = false;
        }
      }
    });
    // regions.on("region-clicked", (region, e) => {
    //   e.stopPropagation(); // prevent triggering a click on the waveform
    //   region.play();
    //   activeRegion.current = region;
    //   activeRegionClickTime.current = Date.now();
    // });

    console.log("Add Event");
  }, []);

  return (
    <>
      {/* 波形表示 */}
      <Box ref={waveformRef} sx={{ width: "100%", marginX: "10px" }}></Box>

      <Button
        variant="contained"
        onMouseUp={() => {
          if (playState.current) {
            playState.current = false;
            waveformRef.current.pause();
          } else {
            activeRegion.current.play();
            playState.current = true;
            activeRegionClickTime.current = Date.now();
          }
        }}
        sx={{ backgroundColor: "#00A39E", color: "#FFFFFF", fontSize: "1rem" }}
      >
        PLAY
      </Button>

      <Button
        variant="contained"
        onMouseUp={() => {
          const buffer = player.buffer?.slice(activeRegion.current.start, activeRegion.current.end)?.get();

          if (typeof buffer !== "undefined") {
            // Blobを関連付け
            // setBuffer(makeWav(buffer));
            // ボタンのステートを変えると再描画してしまう
            // setFixState(true);
            // wavファイルで保存
            // const name = url;
            // const anchor = document.createElement("a");
            // anchor.download = name + ".wav";
            // anchor.href = tmpFileUrl;
            // anchor.click();
          }
        }}
        // sx={{ backgroundColor: fixState == false ? "#F3F3E7" : "#EE6B4B", color: fixState == false ? "#3D4848" : "#FFFFFF", fontSize: "1rem" }}
        sx={{ backgroundColor: "#EE6B4B", color: "#FFFFFF", fontSize: "1rem" }}
      >
        決定
      </Button>
      <Typography>切り抜く範囲が決まったら決定ボタンを押してください</Typography>
    </>
  );
};
