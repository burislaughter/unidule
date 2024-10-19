/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { URL_BASE, URL_RES, channelParams } from "../const";
import { log } from "console";
import { VoiceButton, VoiceButtonProps } from "./VoiceButton";

import "./MaruButton.css";
import { EditWave } from "./EditWave";

const SOUND_URL_BASE = URL_RES + "maru_button";
const VOICE_LIST_URL = URL_BASE + "voice";

function MaruButton() {
  const [isLoaded, setLoaded] = useState<boolean>(false);

  const [voiceButtonList, setVoiceButtonList] = useState<any[]>([]);

  useEffect(() => {
    const vo_list: any[] = [];
    const controller = new AbortController();

    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const promise1 = axiosInstance.get(VOICE_LIST_URL, {
      signal: controller.signal,
    });
    Promise.all([promise1]).then(function (values) {
      const { data: vo_data, status: vo_status } = values[0];

      vo_data.forEach((item: VoiceButtonProps, index: number) => {
        const vo = (
          <Box component="span" key={index} sx={{ marginX: "1px" }}>
            <VoiceButton channel={item.channel} title={item.title} filename={item.filename} />
          </Box>
        );
        vo_list.push(vo);
      });

      // デバッグ EditWave 追加

      const w = vo_data[0];
      const vo = (
        <Box component="span" key={3} sx={{ marginX: "1px" }}>
          <EditWave channel={w.channel} title={"test Edit"} filename={w.filename} />
        </Box>
      );
      vo_list.push(vo);

      setVoiceButtonList(vo_list);

      setLoaded(true);
      console.log("read ok");
    });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <Box sx={{ background: "linear-gradient(135deg, #FFF6F3,#E7FDFF)", height: "100vh" }}>
      <Backdrop sx={{ color: "#fff", zIndex: 1000 }} open={!isLoaded}>
        <CircularProgress sx={{ color: "#FFC84F" }} size="8rem" />
      </Backdrop>

      {isLoaded && (
        <>
          <Box
            sx={{
              paddingTop: 4,
              paddingLeft: 12,
              "@media screen and (max-width:800px)": {
                paddingTop: 0,
                paddingLeft: 0,
              },
            }}
          >
            <Typography
              className="outline"
              component="span"
              // variant="h3"
              gutterBottom
              sx={{
                marginY: 4,
                fontWeight: "bold",
                fontSize: "40px",

                "@media screen and (max-width:800px)": {
                  paddingTop: 0,
                  paddingLeft: 0,
                  fontSize: "32px",
                },
              }}
            >
              花ノ木まるボタン
            </Typography>

            {/* ボタンエリア */}
            <Box sx={{ paddingTop: 4 }}>{voiceButtonList}</Box>
          </Box>
        </>
      )}
    </Box>
  );
}

export default MaruButton;
