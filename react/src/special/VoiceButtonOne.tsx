import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress, IconButton, Snackbar, Alert } from "@mui/material";
import useSound from "use-sound";
import { getUniBgColor, getUniBtnColor, getUniDarkColor, URL_BASE, URL_RES } from "../const";
import "./VoiceButtonOne.css";
import { Cancel as CloseIcon } from "@mui/icons-material";
import { StopCircle as StopCircleIcon } from "@mui/icons-material";
import { Fragment } from "react/jsx-runtime";
import { MouseEventHandler, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import axios from "axios";
import { AxiosRequestConfig } from "axios";

import { FaGhost } from "react-icons/fa";
import { GiRose } from "react-icons/gi";
import { FaRegSnowflake } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { IoDiamondOutline } from "react-icons/io5";
import { SiThunderbird } from "react-icons/si";
import chroma from "chroma-js";
import useSWR from "swr";

import { FaRocket } from "react-icons/fa";
import { FaDragon } from "react-icons/fa";
import { GiTigerHead } from "react-icons/gi";
import { FaGuitar } from "react-icons/fa";
import { CiMedicalCross } from "react-icons/ci";
import { GiFoxTail } from "react-icons/gi";

const FormData = require("form-data");
export type VoiceButtonOneProps = {
  filename: string;
  title: string;
  channel: string;
  uid: string;
  isDenoise: boolean;
  reLoadFunc: any;
  isAdmin: boolean;
  selectVoice: any;
  archiveUrl: string;
  start: string;
  end: string;
  setYtPalyerShotState?: any;
  // tlAddFunc?: any;
  tag: string;
  timelineUid?: string | undefined;
};
const VOICE_LIST_URL = URL_BASE + "voice";

const getIcons = (channel: string) => {
  switch (channel) {
    case "nanase":
      return <FaGhost color="#FFF" className="icon-shadow-b" />;
    case "nagisa":
      return <FaRegSnowflake color="#FFF" className="icon-shadow-b" />;
    case "maru":
      return <LuFlower color="#FFF" className="icon-shadow-b" />;
    case "ran":
      return <GiRose color="#000" className="icon-shadow-w" />;
    case "roman":
      return <IoDiamondOutline color="#FFF" className="icon-shadow-b" />;
    case "ida":
      return <SiThunderbird color="#FF5500" className="icon-shadow-w" />;

    case "rabi":
      return <FaRocket color="#FFF" className="icon-shadow-b" />;
    case "souta":
      return <FaDragon color="#FFF" className="icon-shadow-b" />;
    case "jyui":
      return <GiTigerHead color="#FFF" className="icon-shadow-b" />;
    case "asuto":
      return <FaGuitar color="#FFF" className="icon-shadow-b" />;
    case "hoguno":
      return <CiMedicalCross color="#FFF" className="icon-shadow-b" />;
    case "konn":
      return <GiFoxTail color="#FFF" className="icon-shadow-b" />;
  }
};

export const VoiceButtonOne = ({ filename, title, channel, isDenoise, uid, reLoadFunc, isAdmin, selectVoice, archiveUrl, start, end, setYtPalyerShotState, tag, timelineUid }: VoiceButtonOneProps) => {
  const url = URL_RES + channel + "/" + filename;

  const deleteModeCtx = useContext(DeleteModeFlagContext);
  const deleteKeyCtx = useContext(DeleteKeyContext);
  const VolumeCtx = useContext(VolumeContext);

  const btnProperty = {
    filename: filename,
    title: title,
    channel: channel,
    isDenoise: isDenoise,
    uid: uid,
    archiveUrl: archiveUrl,
    start: start,
    end: end,
    timelineUid: timelineUid,
  };

  const [play, { stop }] = useSound(url, {
    volume: VolumeCtx / 100,
    onend: () => {
      // 再生が最後まで再生しきった場合にステータスを停止に
      setPlayState(false);
    },
  });
  const hasSound = filename != undefined && filename != "";

  const [playState, setPlayState] = useState(false); // 再生状態
  const btnColor = hasSound ? (isDenoise ? getUniBtnColor(channel) : chroma(getUniBtnColor(channel)).desaturate(0.7).brighten(0.6).css()) : getUniDarkColor(channel);

  const btnDelColor = chroma(getUniBtnColor(channel)).darken(1.8).css();

  const uidRef = useRef("");
  uidRef.current = uid;

  const [sending, setSending] = useState<boolean>(false);
  const [errorSnackOpen, setErrorSnackOpen] = useState<boolean>(false);
  const handleErrorSnackClose = () => {
    setErrorSnackOpen(false);
  };
  const errorAction = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleErrorSnackClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );

  const [succsesSnackOpen, setSuccsesSnackOpen] = useState<boolean>(false);
  const handleSuccsesSnackClose = () => {
    setSuccsesSnackOpen(false);
  };
  const succsesAction = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleSuccsesSnackClose}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Fragment>
  );
  let isCallFirst = true;

  // 送信
  const SendDeleteRequest = async (data: any) => {
    setSending(true);

    const requestParam: AxiosRequestConfig = {
      method: "delete",
      url: VOICE_LIST_URL,
      data: data,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*",
      },
    };

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Access-Control-Allow-Origin": "*",
      },
    });

    axiosInstance
      .delete(VOICE_LIST_URL, requestParam)
      .then((w) => {
        console.log(w.data);
        setSending(false);
        setSuccsesSnackOpen(true);
        reLoadFunc((f: number) => {
          return f + 1;
        });
      })
      .catch((err) => {
        console.log(err);
        setSending(false);
        setErrorSnackOpen(true);
        reLoadFunc((f: number) => {
          return f + 1;
        });
      });
  };

  // バックエンドに削除リクエストを行う
  const handleStopButtonClick = useCallback(
    (e: any) => {
      stop();
      setPlayState(false);
      e.stopPropagation();
    },
    [stop]
  );

  // バックエンドに削除リクエストを行う
  const handleDelButtonClick = useCallback(
    (e: any) => {
      console.log("uid" + uidRef.current);
      console.log("delete_key" + deleteKeyCtx);

      //
      SendDeleteRequest({
        delete_key: deleteKeyCtx,
        uid: uidRef.current,
      });

      e.stopPropagation();
    },
    [deleteKeyCtx]
  );

  // マウスを押している時間をカウント
  const [propertyShow, setPropertyShow] = useState(false);

  // マウスを押している時間をカウント
  const [pollingCt, setPollingCt] = useState(0);

  // ポーリング間隔 ms
  const [pollingInterval, setPollingInterval] = useState(0);

  // ポーリング実行関数
  const pollingFuncCB = () => {
    if (setYtPalyerShotState) {
      if (pollingInterval == 0) {
        return;
      }
      console.log("カウントアップ" + isCallFirst + " " + pollingCt);
      setPollingCt((_c) => _c + 1);
    }
  };

  // ポーリング実行Hools
  useSWR("dmy2", pollingFuncCB, {
    refreshInterval: pollingInterval,
  });

  // マウスの押時間で処理
  useEffect(() => {
    if (pollingCt >= 10) {
      console.log("1秒");

      if (setYtPalyerShotState) {
        setPropertyShow(true);
        setPollingInterval(0);
        setYtPalyerShotState(true);
      }
    }
  }, [pollingCt, uidRef.current]);

  return (
    <Box sx={{ display: "inline-block", position: "relative", marginBottom: "1px", lineHeight: "46px" }}>
      <Button
        disabled={!hasSound && !isAdmin}
        variant="contained"
        onPointerUp={() => {
          console.log("ポイントアップ");
          // 長押していた場合はキャンセル
          if (pollingCt == 0) {
            if (!playState) {
              play();
              setPlayState(true);
            } else {
              stop();
              play();
            }
          }

          setPollingInterval(0);
        }}
        onPointerDown={() => {
          // カウント開始
          console.log("ポイントダウン");
          setPollingCt(0);
          setPollingInterval(1000);
          selectVoice(btnProperty);
        }}
        onPointerMove={(event) => {
          console.log("ポイントムーブ");

          // 移動があったらキャンセル
          if (pollingInterval > 0 && (Math.abs(event.movementY) > 2 || Math.abs(event.movementX) > 2)) {
            setPollingInterval(0);
            console.log("ポイントムーブ キャンセル");
          }
        }}
        sx={{
          textTransform: "none",
          backgroundColor: btnColor,
          color: channel === "jyui" ? "rgb(221, 37, 114)" : "#FFFFFF",
          fontSize: "1rem",
          "&:hover": { backgroundColor: btnColor, mixBlendMode: "hard-light" },
        }}
      >
        {title}
        {playState && channel == "ida" && <Box sx={{ width: "32px", height: "32px", position: "absolute", animation: "3s linear infinite rotation-r" }}>{getIcons(channel)}</Box>}
        {playState && channel != "ida" && <Box sx={{ width: "32px", height: "32px", position: "absolute", animation: "3s linear infinite rotation" }}>{getIcons(channel)}</Box>}
      </Button>
      {/* 停止ボタン */}
      {playState && (
        <IconButton size="small" aria-label="stop" onMouseUp={handleStopButtonClick} sx={{ position: "absolute", right: "-10px", bottom: "-10px", color: btnDelColor }}>
          <StopCircleIcon fontSize="medium" />
        </IconButton>
      )}

      {deleteModeCtx && (
        <IconButton size="small" aria-label="close" onMouseUp={handleDelButtonClick} sx={{ position: "absolute", right: "-10px", top: "-10px", color: btnDelColor }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      )}

      <Snackbar anchorOrigin={{ vertical: "bottom", horizontal: "center" }} autoHideDuration={3000} open={errorSnackOpen} onClose={handleErrorSnackClose} action={errorAction} key={"top-center-1"}>
        <Alert onClose={handleSuccsesSnackClose} severity="error" sx={{ width: "100%" }}>
          音声ボタンの削除に失敗しました
        </Alert>
      </Snackbar>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={3000}
        open={succsesSnackOpen}
        onClose={handleSuccsesSnackClose}
        action={succsesAction}
        key={"top-center-2"}
      >
        <Alert onClose={handleSuccsesSnackClose} severity="success" sx={{ width: "100%" }}>
          音声ボタンの削除に成功しました
        </Alert>
      </Snackbar>
    </Box>
  );
};
