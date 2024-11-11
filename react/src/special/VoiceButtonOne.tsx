import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, TextField, Select, MenuItem, Backdrop, CircularProgress, IconButton, Snackbar, Alert } from "@mui/material";
import useSound from "use-sound";
import { getUniBgColor, getUniBtnColor, getUniDarkColor, URL_BASE, URL_RES } from "../const";
import "./VoiceButtonOne.css";
import { Cancel as CloseIcon } from "@mui/icons-material";
import { Fragment } from "react/jsx-runtime";
import { MouseEventHandler, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import axios from "axios";
import { AxiosRequestConfig } from "axios";

import AcUnitIcon from "@mui/icons-material/AcUnit"; // 渚 snow
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaGhost } from "react-icons/fa";
import { GiRose } from "react-icons/gi";
import { FaRegSnowflake } from "react-icons/fa";
import { LuFlower } from "react-icons/lu";
import { IoDiamondOutline } from "react-icons/io5";
import { SiThunderbird } from "react-icons/si";
import useInterval from "./useInterval";
import chroma from "chroma-js";

const FormData = require("form-data");
export type VoiceButtonOneProps = {
  filename: string;
  title: string;
  channel: string;
  uid: string;
  reLoadFunc: any;
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
  }
};

export const VoiceButtonOne = ({ filename, title, channel, uid, reLoadFunc }: VoiceButtonOneProps) => {
  const url = URL_RES + channel + "/" + filename;

  const deleteModeCtx = useContext(DeleteModeFlagContext);
  const deleteKeyCtx = useContext(DeleteKeyContext);
  const VolumeCtx = useContext(VolumeContext);

  const [play, { stop }] = useSound(url, {
    volume: VolumeCtx / 100,
    onend: () => {
      // 再生が最後まで再生しきった場合にステータスを停止に
      setPlayState(false);
    },
  });
  const isNoSound = filename != undefined && filename != "";

  const [playState, setPlayState] = useState(false); // 再生状態
  const btnColor = isNoSound ? getUniBtnColor(channel) : getUniDarkColor(channel);

  const btnDelColor = chroma(getUniBtnColor(channel)).darken(1.8);

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

  return (
    <Box sx={{ display: "inline-block", position: "relative" }}>
      <Button
        disabled={!isNoSound}
        variant="contained"
        onMouseUp={() => {
          if (!playState) {
            play();
            setPlayState(true);
          } else {
            stop();
            play();
          }
        }}
        sx={{
          backgroundColor: btnColor,
          color: "#FFFFFF",
          fontSize: "1rem",
          "&:hover": { backgroundColor: btnColor, mixBlendMode: "hard-light" },
        }}
      >
        {title}
        {playState && channel == "ida" && <Box sx={{ width: "32px", height: "32px", position: "absolute", animation: "3s linear infinite rotation-r" }}>{getIcons(channel)}</Box>}
        {playState && channel != "ida" && <Box sx={{ width: "32px", height: "32px", position: "absolute", animation: "3s linear infinite rotation" }}>{getIcons(channel)}</Box>}
      </Button>
      {deleteModeCtx && (
        <IconButton size="small" aria-label="close" onMouseUp={handleDelButtonClick} sx={{ position: "absolute", right: "-10px", top: "-10px", color: btnDelColor.css() }}>
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
