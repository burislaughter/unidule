/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  Box,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
  Button,
  Typography,
  Backdrop,
  CircularProgress,
  Avatar,
  Tabs,
  Tab,
  SelectChangeEvent,
  Link,
  Stack,
  styled,
  IconButton,
  Switch,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import { SyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { URL_BASE, URL_RES, getUniBtnColor, getUniBgColor, isMember, getOrder, getName, range, channelParams, getChannelAndName, timecodeToSecond, voiceCategory } from "../../const";
import { log } from "console";
import { VoiceButtonOne, VoiceButtonOneProps } from "./VoiceButtonOne";
import { FaCircleUp } from "react-icons/fa6";
import "./VoiceButton.css";
import ChannelFillter from "../../ChannelFillter";
import React from "react";
import { VoiceAddForm } from "./VoiceAddForm";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { VoiceDeleteForm } from "./VoiceDeleteForm";
import { createContext } from "react";
import { SoundCtrl } from "./SoundCtrl";
import { SearchCtrl } from "./SearchCtrl";
import ReactPlayer from "react-player";
import useMedia from "use-media";
import useWindowSize from "../../useWindowSize";
import { HeaderBox, HeaderBoxGroups, TabPanelEx } from "../../styled";
import { animateScroll as scroll } from "react-scroll";
import { Circle, CloudCircleRounded } from "@mui/icons-material";
import BreadcrumbsEx from "../../breadcrumbs";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { ViewMember } from "./ViewMember";
import { ViewCategory } from "./ViewCategory";
import { ViewTimeline } from "./ViewTimeline";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ViewReadMe from "./ViewReadMe";
export const DeleteModeFlagContext = createContext(false);
export const DeleteKeyContext = createContext("");
export const VolumeContext = createContext(60);

const VOICE_LIST_URL = URL_BASE + "voice";
const CHANNEL_INFO_URL = URL_BASE + "channel_info";
const VOICE_TIMELINE_URL = URL_BASE + "voice_timeline";

type kv = {
  key: string;
  value: any;
};

function VoiceButton() {
  const { user, authStatus, route } = useAuthenticator((context) => [context.user, context.authStatus]);
  // メンバーの人数
  const MEMBER_NUM = 12;

  const [tabSelect, setTabSelect] = useState("1");

  const reactPlayerRef = useRef<ReactPlayer>(null);
  const [winWidth, winHeight] = useWindowSize();

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

  const [volume, setVolume] = useState<number>(60);
  const [searchText, setSearchText] = useState<any[]>([]);

  const [isDeleteMode, setDeleteMode] = useState<boolean>(false);
  const [deleteKey, setDeleteKey] = useState<string>("");

  const [ytPalyerShotState, setYtPalyerShotState] = useState<boolean>(false);

  const [vtu, setVtu] = useState<null | string>(null);

  // URLクエリパラメータの取得
  const search = useLocation().search;
  const queryParam = new URLSearchParams(search);
  // 管理モードに入る
  const isAdmin = queryParam.get("admin") == "123456";
  // 外部からvoice_timeline_uidが指定された場合
  const voice_timeline_uid = queryParam.get("vtu");

  const [selectVoice, setSelectVoice] = useState<any>();

  const [voiceButtonGroupList, setVoiceButtonGroupList] = useState<kv[]>([]);
  const [voiceButtonGroupListMaster, setVoiceButtonGroupListMaster] = useState<kv[]>([]);
  const handleChangeTabValue = (event: SyntheticEvent, newValue: any) => {
    setTabValue(newValue);
  };

  // 自分のボタンのみ表示するトグルスイッチ
  const [myVoiceButtonDisp, setMyVoiceButtonDisp] = useState<boolean>(false);
  const myVoiceButtonDispHandler = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    setMyVoiceButtonDisp(checked);
  };

  /****************************************************************************************
   * データの再ロード
   ****************************************************************************************/
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

  /****************************************************************************************
   * データのロード後の振り分け
   ****************************************************************************************/
  useEffect(() => {
    // ゆにメン毎のグループに振り分け
    const vo_list: { [key: string]: any } = {};
    for (let i in range(0, MEMBER_NUM - 1)) {
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
  }, [reDrawCt, deleteKey]);

  /****************************************************************************************
   * ソート条件が変更さてた場合に条件にあう音声のみフィルタリングする
   ****************************************************************************************/
  useEffect(() => {
    console.log("onChange searchText," + searchText);
    // フィルタイング結果を反映

    // メンバー表示時用
    const dic = updateFiltering(sortSelect, searchText);
    if (dic != undefined) setVoiceButtonList(dic);

    // カテゴリー表示時用
    const dicM = updateCategoryFiltering(sortSelect, searchText);
    if (dicM != undefined) setVoiceButtonGroupList(dicM);
  }, [sortSelect, searchText, myVoiceButtonDisp]);

  /****************************************************************************************
   * フィルターリセット
   ****************************************************************************************/
  const resetBtnClickCB = useCallback(() => {
    // setSortSelect(new Set<string>([]));
    setSortSelect((_s) => {
      _s.clear();
      return _s;
    });

    const dic: kv[] = [];
    voiceButtonListMaster!.forEach((x) => {
      dic.push(x);
    });
    setVoiceButtonList(dic);

    const dicM: kv[] = [];
    voiceButtonGroupListMaster!.forEach((x) => {
      dicM.push(x);
    });
    setVoiceButtonGroupList(dicM);

    // フリーワード
    setSearchText([]);
    // マイボタン
    setMyVoiceButtonDisp(false);
  }, [voiceButtonListMaster, voiceButtonGroupListMaster]);

  /****************************************************************************************
   * フィルタイング結果で絞り込みメソッド
   ****************************************************************************************/
  const updateFiltering = (sorted: Set<string>, searchText: any[]) => {
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
        i.value = i.value
          .filter((vv: any) => {
            if (searchText.length == 0) {
              return true;
            }
            return searchText.map((item) => item.title).includes(vv.title);
          })
          .filter((vv: any) => {
            if (myVoiceButtonDisp == false) return true;

            return myVoiceButtonDisp && vv.user_id == user?.userId;
          });
        dic.push(i);
      });
      return dic;
    }
  };

  /****************************************************************************************
   * フィルタイング結果で絞り込みメソッド
   ****************************************************************************************/
  const updateCategoryFiltering = (sorted: Set<string>, searchText: any[]) => {
    // フィルタイング結果を反映
    const vl = structuredClone(voiceButtonGroupListMaster!);
    if (vl != undefined && vl.length != 0) {
      if (sorted.size == 0) {
        getChannelAndName().forEach((x) => {
          sorted.add(x.channel);
        });
      }

      for (const categ in vl) {
        // categ あいさつ
        const fillterdValue: { [carName: string]: any } = [];
        // カテゴリーのなかから、フィルタ対象のメンバーを抽出
        for (const c in vl[categ].value) {
          // 誰の
          sorted.forEach((x) => {
            // なんていう音声か
            if (c.endsWith(x)) {
              const categ_channel_value: VoiceButtonOneProps[] = vl[categ].value[c];

              // searchText
              const ccv_filterd = categ_channel_value
                .filter((ccv) => {
                  if (searchText.length == 0) {
                    return true;
                  }
                  return searchText.map((item) => item.title).includes(ccv.title);
                })
                .filter((vv: any) => {
                  if (myVoiceButtonDisp == false) return true;

                  return myVoiceButtonDisp && vv.user_id == user?.userId;
                });

              if (ccv_filterd.length) fillterdValue[c] = ccv_filterd;
            }
          });
        }
        vl[categ].value = fillterdValue;
      }
      return vl;
    }
  };

  /****************************************************************************************
   * フィルター系ボタンが押された時のハンドリング
   ****************************************************************************************/
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
        const dic = updateFiltering(sorted, searchText);
        if (dic != undefined) setVoiceButtonList(dic);
      }
    },
    [resetBtnClickCB, setSortSelect, sortSelect, voiceButtonListMaster, searchText, myVoiceButtonDisp]
  );

  /****************************************************************************************
   * タブ変更のハンドリング
   ****************************************************************************************/
  const onChangeTab = (event: React.SyntheticEvent, newValue: string) => {
    setTabSelect(newValue);

    if (newValue == "1" || newValue == "3") {
      // メンバー別ソート
    } else if (newValue == "2") {
      // カテゴリー別ソート
      categorySort();
    }
  };

  /****************************************************************************************
   * カテゴリーでソート
   ****************************************************************************************/
  const categorySort = () => {
    //カテゴリー毎のグループに振り分け
    const categList: { [key: string]: any } = {};
    // 音声データリストをループして振り分け
    voDataList.forEach((item: VoiceButtonOneProps, index: number) => {
      if (categList[item.tag] == undefined) categList[item.tag] = [];
      categList[item.tag].push(item);
    });

    // さらに人物毎に分ける
    for (const c in categList) {
      const items: VoiceButtonOneProps[] = categList[c];
      const c_group = Object.groupBy(items, (x) => {
        const order = getOrder(x.channel);

        return order + "_" + x.channel;
      });
      categList[c] = c_group;
    }

    // keyValue形式に変換
    const vo_list_all: kv[] = [];
    for (const c in categList) {
      vo_list_all.push({ key: c, value: categList[c] });
    }

    setVoiceButtonGroupList(vo_list_all);
    setVoiceButtonGroupListMaster(vo_list_all);
  };

  /****************************************************************************************
   * データの再ロード
   ****************************************************************************************/
  useEffect(() => {
    if (voice_timeline_uid == null) return;
    setVtu(voice_timeline_uid);
    setTabSelect("3");
  }, [voice_timeline_uid]);

  /******************************************************************************************************************/
  /******************************************************************************************************************/
  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ background: "linear-gradient(135deg, #FFF6F3,#E7FDFF)", position: "relative", paddingTop: "64px" }}>
        <Backdrop sx={{ color: "#fff", zIndex: 1000 }} open={!isLoaded}>
          <CircularProgress sx={{ color: "#FFC84F" }} size="8rem" />
        </Backdrop>
        {/* Youtubeプレイヤー */}
        <Backdrop
          sx={{ color: "#fff", zIndex: 1 }}
          open={selectVoice != undefined && ytPalyerShotState}
          onClick={() => {
            setYtPalyerShotState(false);
            setSelectVoice(undefined);
          }}
        >
          <Box>
            <Stack direction="row" alignItems="flex-end" sx={{ marginBottom: 1 }}>
              <Button
                variant="contained"
                size="small"
                onClick={(e: any) => {
                  // タイムコードを秒に変換
                  reactPlayerRef.current?.seekTo(timecodeToSecond(selectVoice.start), "seconds");
                  e.stopPropagation();
                }}
              >
                {selectVoice?.start}～
              </Button>
              <Typography>{selectVoice?.title}</Typography>
            </Stack>
            <ReactPlayer
              width={winWidth < 400 ? "360px" : "640px"}
              height={winHeight < 380 ? "240px" : "360px"}
              url={ytPalyerShotState ? selectVoice?.archiveUrl : ""}
              ref={reactPlayerRef}
              config={{
                youtube: {
                  playerVars: { controls: 1 },
                },
              }}
              playing={true}
              onStart={() => {
                // タイムコードを秒に変換
                reactPlayerRef.current?.seekTo(timecodeToSecond(selectVoice.start), "seconds");
              }}
            />
          </Box>
        </Backdrop>

        {isLoaded && (
          <Box
            sx={{
              position: "relative",
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
            <BreadcrumbsEx
              props={[
                { url: "/", label: "スケジューラー" },
                { url: "", label: "音声ボタン" },
              ]}
            ></BreadcrumbsEx>
            {/* コントロール系 */}
            <Stack direction="column" justifyContent="start" className="flex-wrap">
              {/* ソートボタン */}
              <Box>
                <ChannelFillter channelInfo={channelInfo} fillterBtnClickCB={fillterBtnClickCB} sortSelect={sortSelect} resetBtnClickCB={resetBtnClickCB} />
              </Box>

              <Stack direction="row">
                <SoundCtrl setVolume={setVolume} allStop={() => {}} />
                <FormGroup sx={{ marginTop: "12px", marginLeft: "20px" }}>
                  <FormControlLabel
                    disabled={authStatus !== "authenticated"}
                    control={<Switch size="small" checked={myVoiceButtonDisp} onChange={myVoiceButtonDispHandler} />}
                    label={`マイボタン ${myVoiceButtonDisp ? "ON" : "OFF"}`}
                  />
                </FormGroup>
              </Stack>

              <SearchCtrl setSearchWords={setSearchText} searchWords={searchText} voiceButtonListMaster={voiceButtonListMaster} />
            </Stack>
            <Typography sx={{ fontSize: "0.8rem", marginLeft: "10px" }}>操作説明はREADMEをご覧ください</Typography>
            {/* タブエリア */}
            <TabContext value={tabSelect}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList onChange={onChangeTab} aria-label="チャンネルフィルター">
                  <Tab label="member" value="1" />
                  <Tab label="category" value="2" />
                  <Tab label="timeline" value="3" />
                  <Tab label="README" value="4" />
                </TabList>
              </Box>
              <TabPanelEx value="1">
                {/* メンバー別 ボタンエリア */}
                <Box sx={{ marginTop: 4 }}>
                  <ViewMember
                    voiceButtonList={voiceButtonList}
                    ciDataList={ciDataList}
                    volume={volume}
                    deleteKey={deleteKey}
                    isDeleteMode={isDeleteMode}
                    isAdmin={isAdmin}
                    setReLoadCt={setReLoadCt}
                    setSelectVoice={setSelectVoice}
                    setYtPalyerShotState={setYtPalyerShotState}
                  />
                </Box>
              </TabPanelEx>
              <TabPanelEx value="2" sx={{ margin: 0, width: "99%" }}>
                {/* カテゴリー別 */}
                <ViewCategory
                  voiceButtonGroupList={voiceButtonGroupList}
                  ciDataList={ciDataList}
                  volume={volume}
                  deleteKey={deleteKey}
                  isDeleteMode={isDeleteMode}
                  isAdmin={isAdmin}
                  setReLoadCt={setReLoadCt}
                  setSelectVoice={setSelectVoice}
                  setYtPalyerShotState={setYtPalyerShotState}
                />
              </TabPanelEx>
              <TabPanelEx value="3">
                {/* タイムラインエリア */}
                <Box sx={{ marginTop: 4 }}>
                  <ViewTimeline
                    voiceButtonList={voiceButtonList}
                    voDataList={voDataList}
                    ciDataList={ciDataList}
                    volume={volume}
                    deleteKey={deleteKey}
                    isDeleteMode={isDeleteMode}
                    isAdmin={isAdmin}
                    setReLoadCt={setReLoadCt}
                    setSelectVoice={setSelectVoice}
                    vtu={vtu}
                  />
                </Box>
              </TabPanelEx>

              <TabPanelEx value="4">
                {/* タイムラインエリア */}
                <Box sx={{ marginTop: 4 }}>
                  <ViewReadMe />
                </Box>
              </TabPanelEx>
            </TabContext>
            <Box sx={{ paddingTop: 4 }}>{waveEditComp}</Box>

            {tabSelect == "1" && (
              <TabContext value={tabValue}>
                <TabList onChange={handleChangeTabValue} aria-label="simple tabs example">
                  <Tab label="音声追加" value="1" />
                  <Tab label="音声削除" value="2" />
                </TabList>
                <TabPanel value="1">
                  <VoiceAddForm reloadFunc={setReLoadCt} selectVoice={selectVoice} isAdmin={isAdmin} />
                </TabPanel>
                <TabPanel value="2">
                  <VoiceDeleteForm deleteMode={isDeleteMode} deleteModeChangeFunc={setDeleteMode} setDeleteKey={setDeleteKey} reDrawFunc={setReDrawCt} />
                </TabPanel>
              </TabContext>
            )}
          </Box>
        )}

        {/* 上に戻るボタン */}
        <IconButton
          id="goTop"
          sx={{ position: "fixed ", bottom: "6px", right: "10px" }}
          onClick={() => {
            scroll.scrollToTop();
          }}
        >
          <FaCircleUp />
        </IconButton>
      </Box>
    </DndProvider>
  );
}

export default VoiceButton;
