import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { getOrder, getUniBgColor, URL_RES } from "../const";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import { useRef, useState } from "react";
import { useDrop, XYCoord } from "react-dnd";
import { VoiceButtonOneDnD, VoiceButtonRect } from "./VoiceButtonOneDnD";
import { useGetElementProperty } from "./useGetElementProperty";
import { Howl } from "howler";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import { GrClear } from "react-icons/gr";
import { TbClearAll } from "react-icons/tb";

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
};

export const ViewTimeline = ({ voiceButtonList, voDataList, ciDataList, volume, deleteKey, isDeleteMode, isAdmin, setReLoadCt, setSelectVoice }: ViewTimelineProp) => {
  const [playList, setPlayList] = useState<VoiceButtonRect[]>([]);
  const [renderCt, setRenderCt] = useState(0);
  const [audioPlayer, setAudioPlayer] = useState<any>();

  const leftAreaRef = useRef(null);
  const { getElementProperty: getElementPropertyLeft } = useGetElementProperty<HTMLDivElement>(leftAreaRef);
  const rightAreaRef = useRef(null);
  const { getElementProperty: getElementPropertyRight } = useGetElementProperty<HTMLDivElement>(rightAreaRef);
  const playStepRef = useRef(0);

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

  // プレイリスト確定
  const handlerSetPlay = () => {
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
  };

  // ALL PLAYボタンのハンドラ
  const handlerAllPlay = () => {
    playStepRef.current = 0;

    audioPlayer[0].play();
  };

  // 削除
  const handlerClear = () => {
    audioPlayer[playStepRef.current].stop();
    playStepRef.current = 0;
    setPlayList([]);
    setAudioPlayer([]);
  };

  // 停止
  const handlerStop = () => {
    audioPlayer[playStepRef.current].stop();
    playStepRef.current = 0;
  };

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

  const srcX = getElementPropertyLeft("x");
  const srcY = getElementPropertyLeft("y");

  return (
    <Box margin={"10px"} position="relative">
      {/* <DragLayer /> */}
      <Typography>{renderCt}</Typography>
      <Stack direction="row">
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
            <Stack direction="row" sx={{ position: "absolute", right: 0, top: "-40px" }}>
              <Button variant="contained" onClick={handlerSetPlay} endIcon={<TbClearAll size={"18px"} color="#FFF" />} sx={{ marginRight: "4px" }}>
                Set
              </Button>
              <Button variant="contained" onClick={handlerAllPlay} endIcon={<PlayCircleOutlineIcon />} sx={{ marginRight: "4px" }}>
                All Play
              </Button>

              <Button variant="contained" onClick={handlerStop} endIcon={<StopCircleIcon />} sx={{ marginRight: "4px" }}>
                Stop
              </Button>

              <Button variant="contained" onClick={handlerClear} endIcon={<GrClear size={"18px"} color="#FFF" />}>
                Clear
              </Button>
            </Stack>

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
    </Box>
  );
};
