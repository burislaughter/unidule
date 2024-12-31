import { Alert, Avatar, Box, Button, FormControl, FormHelperText, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Snackbar, Stack, styled, TextField, Typography } from "@mui/material";
import { getOrder, getUniBgColor, URL_BASE, URL_HOST, URL_RES } from "../const";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import { Fragment, useEffect, useRef, useState } from "react";
import { useDrop, XYCoord } from "react-dnd";
import { VoiceButtonOneDnD, VoiceButtonRect } from "./VoiceButtonOneDnD";
import { useGetElementProperty } from "./useGetElementProperty";
import { Howl } from "howler";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { GrClear } from "react-icons/gr";
import { TbClearAll } from "react-icons/tb";
import { CiShare2 } from "react-icons/ci";
import { CgCopy } from "react-icons/cg";
import { Close as CloseIcon } from "@mui/icons-material";
import { CiExport, CiImport } from "react-icons/ci";

import "./ViewTimeline.css";
import { useAuthenticator } from "@aws-amplify/ui-react";
import axios from "axios";
import { VoiceTimelineTitle } from "./VoiceTimelineTitle";

const VOICE_TIMELINE_URL = URL_BASE + "voice_timeline";

export type ViewTimelineProp = {
  voiceButtonList: any[];
  voDataList: any[];
  ciDataList: any[];

  volume: number;
  deleteKey: string;
  isDeleteMode: boolean;
  isAdmin: boolean;

  setReLoadCt: any;
  setSelectVoice: any;
  vtu: string | null;
};

export const ViewTimeline = ({ voiceButtonList, voDataList, ciDataList, volume, deleteKey, isDeleteMode, isAdmin, setReLoadCt, setSelectVoice, vtu }: ViewTimelineProp) => {
  const { user, authStatus, route } = useAuthenticator((context) => [context.user, context.authStatus]);
  const [playList, setPlayList] = useState<VoiceButtonRect[]>([]);
  const [audioPlayer, setAudioPlayer] = useState<any>([]);

  const leftAreaRef = useRef(null);
  const { getElementProperty: getElementPropertyLeft } = useGetElementProperty<HTMLDivElement>(leftAreaRef);
  const rightAreaRef = useRef(null);
  const { getElementProperty: getElementPropertyRight } = useGetElementProperty<HTMLDivElement>(rightAreaRef);
  const playStepRef = useRef(0);

  const [sharedURL, setSharedURL] = useState("");
  const [voiceTitle, setVoiceTitle] = useState("");

  const [myVTUs, setMyVTUs] = useState<any[]>([]);
  const [vtuSelect, setVTUSelect] = useState<any>({});

  // 作成済の自分のタイムラインデータの選択が変更された
  const handleVTUSelectChange = (event: SelectChangeEvent) => {
    const v = event.target.value as any;
    setVTUSelect(v);

    setVoiceTitle(v.title);
    setPlayList(v.data);
  };

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

  //クリップボードにコピー関数 /////////////////////////////////////////////////////////
  const copyToClipboard = async () => {
    await global.navigator.clipboard.writeText(sharedURL);
    setSuccsesSnackOpen(true);
  };

  // 連続再生の一つが終わった時のコールバック
  const playFinisshCB = (howls: any[]) => {
    console.log("playFinisshCB !");

    playStepRef.current = playStepRef.current + 1;
    if (playStepRef.current >= howls.length) {
      playStepRef.current = 0;
      console.log("all Finissh");
    } else {
      howls[playStepRef.current].play();
    }
  };

  // URLパラメータにVoive Timeline UIDがあるならそれをもってタイムラインを復元
  useEffect(() => {
    if (vtu == null) return;
    const controller = new AbortController();
    axios
      .get(VOICE_TIMELINE_URL, {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          vtu: vtu,
        },
        withCredentials: false,
      })
      .then((w) => {
        setPlayList(w.data.data);
        setVoiceTitle(w.data.title);

        console.log("GetVTU OK");
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      controller.abort();
    };
  }, [vtu]);

  // プレイリスト確定+再生 /////////////////////////////////////////////////////////
  const handlerAllPlay = () => {
    if (playList.length == 0) return;
    const l = playList.map<string>((x) => {
      const p = voDataList.find((y) => y.uid == x.uid);
      return URL_RES + p.channel + "/" + p.filename;
    });

    const howls = l.map((_x) => {
      return new Howl({
        src: [_x],
        autoplay: false,
        loop: false,
        volume: volume / 100.0,
        onend: () => {
          playFinisshCB(howls);
        },
      });
    });

    playStepRef.current = 0;
    setAudioPlayer(howls);

    howls[0].play();
  };

  // 削除 /////////////////////////////////////////////////////////
  const handlerClear = () => {
    if (audioPlayer.length !== 0) audioPlayer[playStepRef.current].stop();

    playStepRef.current = 0;
    setPlayList([]);
    setAudioPlayer([]);
  };

  // 停止 /////////////////////////////////////////////////////////
  const handlerStop = () => {
    if (audioPlayer.length == 0) return;

    audioPlayer[playStepRef.current].stop();
    playStepRef.current = 0;
  };

  // エクスポート /////////////////////////////////////////////////////////
  const handlerExport = async () => {
    if (playList.length == 0) return;
    console.log("export");

    const saveName = playList
      .map((x) => x.title)
      .join("_")
      .substring(0, 32);

    const opts = {
      suggestedName: saveName,
      types: [
        {
          description: "音声ボタンタイムラインファイル",
          accept: { "application/json": [".json"] },
        },
      ],
    };
    try {
      const handle = await (window as any).showSaveFilePicker(opts);
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(playList));
      await writable.close();
    } catch (e) {
      console.log(e);
    }
  };

  // URLでシェア /////////////////////////////////////////////////////////
  const handlerShare = async () => {
    console.log("Share");

    axios.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    // audioPlayer
    const body = {
      userId: user?.userId ?? "",
      title: voiceTitle,
      timelineId: crypto.randomUUID(), // タイムラインのIDとしてuuidを生成
      data: playList,
    };

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    axiosInstance
      .post(VOICE_TIMELINE_URL, body)
      .then((w) => {
        console.log(w.data);
        setSharedURL(URL_HOST + "sp/voice_button?vtu=" + w.data.uid);

        setMyVTUs([body].concat(myVTUs));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // インポート /////////////////////////////////////////////////////////
  const handlerImport = async () => {
    console.log("import");

    const opts = {
      types: [
        {
          description: "音声ボタンタイムラインファイル",
          accept: { "application/json": [".json"] },
        },
      ],
    };

    try {
      const handle = await (window as any).showOpenFilePicker(opts);
      const file = await handle[0].getFile();

      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = (event) => {
        console.log(event?.target?.result);

        const obj = JSON.parse(String(event?.target?.result));
        setPlayList(obj);
      };
    } catch (e) {
      console.log(e);
    }
  };

  // ドロップを受けた時のコールバック (素材→タイムライン)
  const [collectedProps, drop] = useDrop<VoiceButtonRect>(
    () => ({
      accept: "voice",
      drop(item: VoiceButtonRect, monitor) {
        const srcX = getElementPropertyLeft("x");
        const destX = getElementPropertyRight("x");
        const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;

        const top = item.posY + Math.round(delta.y);
        const left = srcX + delta.x + item.posX - destX;
        // ドラッグされたアイテムのドラッグエリア相対座標
        console.log(left, top);

        // あったらそのまま、無ければ採番
        const timelineUid = item.timelineUid != undefined ? item.timelineUid : crypto.randomUUID();

        // timelineUidが存在したら削除
        const new_playList = playList.filter((_x) => {
          return _x.timelineUid != timelineUid;
        });

        // いったん追加
        new_playList.push({
          uid: item.uid,
          title: item.title,
          posX: 0,
          posY: top,
          width: item.width,
          height: item.height,
          timelineUid: timelineUid,
        });

        let ofs = 0;
        new_playList
          // Y座標でソート
          .sort((a, b) => a.posY - b.posY)
          // Y座標を割り振りなおし
          .forEach((x, index, array) => {
            x.posY = ofs;
            ofs += x.height;
          });

        setPlayList(new_playList.concat());

        return undefined;
      },
    }),
    [leftAreaRef, rightAreaRef, voDataList, playList]
  );

  // ドロップを受けた時のコールバック (タイムライン内)
  const [collectedPropsSrc, dropSrc] = useDrop<VoiceButtonRect>(
    () => ({
      accept: "voice",
      drop(item: VoiceButtonRect, monitor) {
        // timelineUidが存在したら削除
        const new_playList = playList.filter((_x) => {
          return _x.timelineUid != item.timelineUid;
        });

        let ofs = 0;
        new_playList
          // Y座標でソート
          .sort((a, b) => a.posY - b.posY)
          // Y座標を割り振りなおし
          .forEach((x, index, array) => {
            x.posY = ofs;
            ofs += x.height;
          });

        setPlayList(new_playList.concat());

        return undefined;
      },
    }),
    [leftAreaRef, rightAreaRef, voDataList, playList]
  );

  // ログインしてる時に作成済のタイムラインを取得
  // 新しい順に
  useEffect(() => {
    if (user?.userId == undefined) return;

    const controller = new AbortController();
    axios
      .get(VOICE_TIMELINE_URL, {
        headers: {
          "Content-Type": "application/json",
        },
        params: {
          user_id: user?.userId,
        },
        withCredentials: false,
      })
      .then((w) => {
        console.log("GetVTU List OK" + w.data.length);
        setMyVTUs(w.data);
      })
      .catch((err) => {
        console.log(err);
      });

    return () => {
      controller.abort();
    };
  }, [user?.userId]);

  const srcX = getElementPropertyLeft("x");
  const srcY = getElementPropertyLeft("y");

  return (
    <Box margin={"10px"} position="relative">
      {/* <DragLayer /> */}
      {/* ボタン類 */}
      {/* <Box sx={{ position: "absolute", right: 0, top: "-45px", overflow: "visible" }}> */}
      <Box>
        <Stack direction="row" justifyContent="end">
          <Button variant="contained" onClick={handlerAllPlay} endIcon={<PlayCircleOutlineIcon />} sx={{ marginRight: "4px" }}>
            All Play
          </Button>
          <Button variant="contained" onClick={handlerStop} endIcon={<StopCircleIcon />} sx={{ marginRight: "4px" }}>
            Stop
          </Button>
          <Button variant="contained" onClick={handlerClear} className="set-button" endIcon={<GrClear className="set-icon" />}>
            Clear
          </Button>
          <Button variant="contained" onClick={handlerExport} className="save-button" endIcon={<CiExport className="save-icon" />} sx={{ marginLeft: "3px" }}>
            Export
          </Button>
          <Button variant="contained" onClick={handlerShare} className="share-button" endIcon={<CiShare2 className="share-icon" />} sx={{ marginLeft: "3px" }}>
            share
          </Button>
          <Button variant="contained" onClick={handlerImport} className="save-button" endIcon={<CiImport className="save-icon" />} sx={{ marginLeft: "3px" }}>
            Import
          </Button>
        </Stack>
        <Stack direction="row" justifyContent="end" sx={{ marginTop: "6px", marginBottom: "0px" }}>
          <FormControl sx={{ m: 1, minWidth: 200 }}>
            <InputLabel id="label">Share履歴</InputLabel>
            <Select value={vtuSelect} autoWidth={true} label="Share履歴" onChange={handleVTUSelectChange}>
              {myVTUs.map((x) => (
                <MenuItem value={x}>{x.title ?? "No Title"}</MenuItem>
              ))}
            </Select>
            <FormHelperText>シェアURLを作成した履歴</FormHelperText>
          </FormControl>

          <VoiceTimelineTitle
            initValue={voiceTitle}
            onBlur={(value: any) => {
              setVoiceTitle(value);
            }}
          />
          {/* <FormControl sx={{ m: 1, minWidth: 200 }}>
            <TextField
              inputRef={voiceTitleRef}
              value={voiceTitleRef?.current}
              id="standard-basic"
              label="音声のタイトル"
              variant="outlined"
              onChange={(event) => {
                voiceTitleRef.current = event.target.value;
              }}
              onBlur={(event) => {
                setVoiceTitle(event.target.value);
              }}
            />
          </FormControl> */}
        </Stack>
        {sharedURL != "" && (
          <Stack direction="row" justifyContent="end" sx={{ marginTop: "0px", marginBottom: "6px" }}>
            <Typography sx={{ fontSize: "0.8rem" }}>共有用URL:</Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#1976D2" }}>{sharedURL}</Typography>
            <IconButton onClick={() => copyToClipboard()} sx={{ width: "20px", height: "20px", padding: 0, margin: 0, marginLeft: "2px" }}>
              <CgCopy />
            </IconButton>
          </Stack>
        )}
      </Box>
      <Stack direction="row" sx={{ marginTop: "0px" }}>
        <Box ref={dropSrc} sx={{ width: "50%" }}>
          <Box sx={{ width: "100%" }} ref={leftAreaRef}>
            {voiceButtonList?.map((x) => {
              const name = x.key;
              const item = x.value;

              // const name = getName(key);
              const key = getOrder(name);
              const ci = ciDataList.filter((x: any) => x.channel == name);
              return (
                <Box key={key} sx={{ position: "relative", lineHeight: "46px" }}>
                  <Box
                    sx={{
                      marginBottom: 2,
                      marginRight: 1,
                      paddingTop: 1,
                      paddingBottom: 1.5,
                      paddingLeft: 4,
                      backgroundColor: getUniBgColor(name),
                      minHeight: "34px",
                    }}
                  >
                    {item?.map((item_one: any, index: number) => {
                      return (
                        <VolumeContext.Provider value={volume} key={index}>
                          <DeleteKeyContext.Provider value={deleteKey}>
                            <DeleteModeFlagContext.Provider value={isDeleteMode}>
                              <Box component="span" sx={{ marginX: "2px" }}>
                                <VoiceButtonOneDnD
                                  filename={item_one.filename}
                                  title={item_one.title}
                                  channel={item_one.channel}
                                  isDenoise={item_one.isDenoise}
                                  uid={item_one.uid}
                                  reLoadFunc={setReLoadCt}
                                  isAdmin={isAdmin}
                                  selectVoice={setSelectVoice}
                                  archiveUrl={item_one.url}
                                  start={item_one.start}
                                  end={item_one.end}
                                  // tlAddFunc={tlAddFunc}
                                  tag={item_one.tag}
                                  parentX={srcX}
                                  parentY={srcY}
                                />
                              </Box>
                            </DeleteModeFlagContext.Provider>
                          </DeleteKeyContext.Provider>
                        </VolumeContext.Provider>
                      );
                    })}
                  </Box>
                  <Box
                    sx={{
                      justifyContent: " space-evenly",
                      display: "flex",
                      marginRight: "3px",
                      position: "absolute",
                      top: "-12px",
                      left: "28px",
                      "@media screen and (max-width:800px)": {
                        left: 44,
                      },
                    }}
                  >
                    <Avatar
                      src={ci[0]?.snippet?.thumbnails?.default?.url}
                      sx={{
                        width: 44,
                        right: 44,
                        boxShadow: 3,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* <DragLayer /> */}
        <Box ref={rightAreaRef} sx={{ margin: 0, width: "50%" }}>
          <Box ref={drop} sx={{ width: "100%", backgroundColor: "#Fcc", height: "100%", minHeight: "200px", position: "relative" }}>
            {playList?.map((x, index) => {
              const vo = voDataList.find((v) => {
                return v.uid == x.uid;
              });
              if (vo) {
                return (
                  <VolumeContext.Provider value={volume} key={index}>
                    <DeleteKeyContext.Provider value={deleteKey}>
                      <DeleteModeFlagContext.Provider value={isDeleteMode}>
                        <Box sx={{ marginX: "2px" }}>
                          <VoiceButtonOneDnD
                            filename={vo.filename}
                            title={vo.title}
                            channel={vo.channel}
                            isDenoise={vo.isDenoise}
                            uid={vo.uid}
                            reLoadFunc={setReLoadCt}
                            isAdmin={isAdmin}
                            selectVoice={setSelectVoice}
                            archiveUrl={vo.url}
                            start={vo.start}
                            end={vo.end}
                            // tlAddFunc={tlAddFunc}
                            tag={vo.tag}
                            parentX={srcX}
                            parentY={srcY}
                            timelineUid={x.timelineUid}
                          />
                        </Box>
                      </DeleteModeFlagContext.Provider>
                    </DeleteKeyContext.Provider>
                  </VolumeContext.Provider>
                );
              } else {
                return <></>;
              }
            })}
          </Box>
        </Box>
      </Stack>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        autoHideDuration={3000}
        open={succsesSnackOpen}
        onClose={handleSuccsesSnackClose}
        action={succsesAction}
        key={"top-center-3"}
      >
        <Alert onClose={handleSuccsesSnackClose} severity="success" sx={{ width: "100%" }}>
          クリップボードにコピーしました
        </Alert>
      </Snackbar>
    </Box>
  );
};
