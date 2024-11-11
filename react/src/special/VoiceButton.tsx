/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, FormControl, InputLabel, Input, FormHelperText, Button, Typography, Backdrop, CircularProgress, Avatar, Tabs, Tab, SelectChangeEvent, Link, Stack } from "@mui/material";
import { SyntheticEvent, useCallback, useEffect, useState } from "react";
import axios from "axios";
import { URL_BASE, URL_RES, getUniBtnColor, getUniBgColor, isMember, getOrder, getName, range, channelParams, getChannelAndName } from "../const";
import { log } from "console";
import { VoiceButtonOne, VoiceButtonOneProps } from "./VoiceButtonOne";

import "./VoiceButton.css";
import ChannelFillter from "../ChannelFillter";
import React from "react";
import { VoiceAddForm } from "./VoiceAddForm";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { VoiceDeleteForm } from "./VoiceDeleteForm";
import { createContext } from "react";
import { SoundCtrl } from "./SoundCtrl";
import { SearchCtrl } from "./SearchCtrl";

export const DeleteModeFlagContext = createContext(false);
export const DeleteKeyContext = createContext("");
export const VolumeContext = createContext(100);

const SOUND_URL_BASE = URL_RES + "voice_button";
const VOICE_LIST_URL = URL_BASE + "voice";
const CHANNEL_INFO_URL = URL_BASE + "channel_info";

type kv = {
  key: string;
  value: any;
};

function VoiceButton() {
  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [reLoadCt, setReLoadCt] = useState<number>(0);
  const [reDrawCt, setReDrawCt] = useState<number>(0);

  const [voDataList, setVoDataList] = useState<any[]>([]);
  const [ciDataList, setCiDataList] = useState<any[]>([]);

  const [voiceButtonList, setVoiceButtonList] = useState<kv[]>([]);
  const [voiceButtonListMaster, setVoiceButtonListMaster] = useState<any[]>([]);
  const [channelInfo, setChannelInfo] = useState<any>();
  const [sortSelect, setSortSelect] = useState<Set<string>>(new Set([]));

  const [waveEditComp, setWaveEditComp] = useState<any>([]);
  const [tabValue, setTabValue] = useState<string>("1");

  const [volume, setVolume] = useState<number>(100);
  const [searchText, setSearchText] = useState<string>("");

  const [isDeleteMode, setDeleteMode] = useState<boolean>(false);
  const [deleteKey, setDeleteKey] = useState<string>("");

  const handleChangeTabValue = (event: SyntheticEvent, newValue: any) => {
    setTabValue(newValue);
  };

  const onClickAllStop = () => {
    console.log("ALL STOP VOICE");
  };

  useEffect(() => {
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
    const promise2 = axiosInstance.get(CHANNEL_INFO_URL, {
      signal: controller.signal,
    });

    Promise.all([promise1, promise2]).then(function (values) {
      // チャンネル情報
      const { data: ci_data, status: ci_status } = values[1];
      setChannelInfo(
        ci_data.filter((x: any) => {
          return isMember(x.channel);
        })
      );

      const { data: vo_data, status: vo_status } = values[0];

      // Webから取得したデータを保持
      setVoDataList(vo_data);
      setCiDataList(ci_data);
      setReDrawCt(reDrawCt + 1);
      setLoaded(true);
      console.log("read ok");
    });

    return () => {
      controller.abort();
    };
  }, [reLoadCt]);

  // データをロードした場合
  useEffect(() => {
    // ゆにメン毎のグループに振り分け
    const vo_list: { [key: string]: any } = {};
    for (let i in range(0, 5)) {
      const key = getName(Number(i));
      vo_list[key] = [];
    }
    voDataList.forEach((item: VoiceButtonOneProps, index: number) => {
      if (vo_list[item.channel] == undefined) vo_list[item.channel] = [];
      vo_list[item.channel].push(item);
    });

    // キーを含んだ配列に変換 オブジェクト⇒配列
    var vo_list_ary = Object.keys(vo_list).map((k) => ({ key: k, value: vo_list[k] }));
    vo_list_ary.sort((a: any, b: any) => {
      return getOrder(a.key) - getOrder(b.key);
    });
    // 配列⇒オブジェクト　で元に戻す
    const vo_list_obj = Object.assign(
      {},
      ...vo_list_ary.map((item) => ({
        [item.key]: item.value,
      }))
    );

    // ゆにメン毎の領域に分離したコンポーネントを作成
    const vo_list_all: any[] = [];
    Object.keys(vo_list_obj).forEach((key) => {
      const ci = ciDataList.filter((x: any) => {
        return x.channel == key;
      });
      vo_list_all.push({ key: key, value: vo_list[key] });
    });

    setVoiceButtonListMaster(vo_list_all.concat());

    setVoiceButtonList(vo_list_all.concat());
    // EditWave 追加
    // const w = vo_data[0];
    // const vo = (
    //   <Box component="span" key={3} sx={{ marginX: "1px" }}>
    //     <EditWave channel={"maru"} title={""} filename={"03ari.mp3"} />
    //   </Box>
    // );
    // setWaveEditComp(vo);
  }, [reDrawCt, deleteKey]);

  useEffect(() => {
    console.log("onChange searchText," + searchText);

    // フィルタイング結果を反映
    const dic = updateFilterring(sortSelect, searchText);
    if (dic != undefined) setVoiceButtonList(dic);
  }, [sortSelect, searchText]);

  // フィルターリセット
  const resetBtnClickCB = React.useCallback(() => {
    const dic: kv[] = [];
    voiceButtonListMaster!.forEach((x) => {
      dic.push(x);
    });

    setVoiceButtonList(dic);

    setSortSelect(new Set<string>([]));
  }, [voiceButtonListMaster]);

  const updateFilterring = (sorted: Set<string>, searchText: string) => {
    // フィルタイング結果を反映
    const vl = voiceButtonListMaster!;
    if (vl != undefined && vl.length != 0) {
      const dic: kv[] = [];

      if (sorted.size == 0) {
        getChannelAndName().forEach((x) => {
          sorted.add(x.channel);
        });
      }

      sorted.forEach((x) => {
        const item = vl.filter((v) => {
          return x == v.key;
        });

        const i = structuredClone(item[0]);
        // 検索文字列を含むか
        i.value = i.value.filter((vv: any) => {
          if (searchText == "") {
            return true;
          }

          return vv.title.indexOf(searchText) != -1;
        });

        dic.push(i);
      });
      return dic;
    }
  };

  // フィルター系ボタンが押された時のコールバック
  const fillterBtnClickCB = React.useCallback(
    (channel: string) => {
      if (sortSelect.has(channel)) {
        sortSelect?.delete(channel);
      } else {
        sortSelect?.add(channel);
      }

      // ソート
      const sorted = new Set<string>([]);
      getChannelAndName().forEach((cn) => {
        if (sortSelect.has(cn.channel)) {
          sorted.add(cn.channel);
        }
      });
      setSortSelect(sorted);

      if (sorted.size == 0) {
        resetBtnClickCB();
      } else {
        // フィルタイング結果を反映
        const dic = updateFilterring(sorted, searchText);
        if (dic != undefined) setVoiceButtonList(dic);
      }
    },
    [resetBtnClickCB, setSortSelect, sortSelect, voiceButtonListMaster, searchText]
  );

  return (
    <Box sx={{ background: "linear-gradient(135deg, #FFF6F3,#E7FDFF)" }}>
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
              gutterBottom
              sx={{
                marginY: 4,
                fontWeight: "bold",
                fontSize: "40px",

                "@media screen and (max-width:800px)": {
                  paddingTop: 0,
                  paddingLeft: 0,
                  fontSize: "32px",
                  textAlign: "center",
                  width: "100%",
                },
              }}
            >
              ゆにれいど！音声ボタン
            </Typography>
            <Typography sx={{ textAlign: "right", fontSize: "0.75rem", marginBottom: "4px" }}>
              <Link href="/">スケジューラーに戻る</Link>
            </Typography>

            {/* ソートボタン */}
            <Stack direction="row" justifyContent="start" className="flex-wrap">
              <Box className="left-column">
                <ChannelFillter channelInfo={channelInfo} fillterBtnClickCB={fillterBtnClickCB} sortSelect={sortSelect} resetBtnClickCB={resetBtnClickCB} />
              </Box>

              <Stack direction="column" justifyContent="center" className="right-column">
                <SoundCtrl setVolume={setVolume} allStop={onClickAllStop} />
                <SearchCtrl setSearchWord={setSearchText} voiceButtonListMaster={voiceButtonListMaster} />
              </Stack>
            </Stack>

            {/* ボタンエリア */}
            <Box sx={{ marginTop: 4 }}>
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
                                  <VoiceButtonOne filename={item_one.filename} title={item_one.title} channel={item_one.channel} uid={item_one.uid} reLoadFunc={setReLoadCt} />
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

            <Box sx={{ paddingTop: 4 }}>{waveEditComp}</Box>

            <TabContext value={tabValue}>
              <TabList onChange={handleChangeTabValue} aria-label="simple tabs example">
                <Tab label="音声追加" value="1" />
                <Tab label="音声削除" value="2" />
              </TabList>
              <TabPanel value="1">
                <VoiceAddForm reloadFunc={setReLoadCt} />
              </TabPanel>
              <TabPanel value="2">
                <VoiceDeleteForm deleteMode={isDeleteMode} deleteModeChangeFunc={setDeleteMode} setDeleteKey={setDeleteKey} reDrawFunc={setReDrawCt} />
              </TabPanel>
            </TabContext>
          </Box>
        </>
      )}
    </Box>
  );
}

export default VoiceButton;
