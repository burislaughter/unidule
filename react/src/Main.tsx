/** @jsxImportSource @emotion/react */
import * as React from "react";
import { Backdrop, Box, Button, CircularProgress, Divider, Grid, Link, Typography } from "@mui/material";
import styled from "@emotion/styled";
import axios from "axios";
import { MediaCard } from "./MediaCard";
import { InformationCard } from "./InformationCard";
import { format, addDays, subDays, startOfDay, addHours } from "date-fns";
import { URL_BASE, channelParams } from "./const";
import { Tweet } from "react-twitter-widgets";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import ChannelFillter from "./ChannelFillter";
import { Summary } from "./Summary";
import { ReadMe } from "./ReadMe";
import { useNavigate } from "react-router-dom";
import { HeaderBox, TabPanelEx } from "./styled";
import { getAuthToken, AuthToken } from "./AuthToken";

const buildDate = "2024.11.23";

export const getChannelInfo = (cis: any[], item: any): any => {
  const cid = channelParams[item.channel];

  if (cid === undefined || cid?.uid === "") {
    return {
      id: item.snippet.channelId,
      snippet: item.snippet.channelInfo?.snippet,
    };
  }

  return cis.find((x) => x.id == cid.uid);
};

export const getTwitterId = (channel: string): string => {
  const cid = channelParams[channel];
  return cid.twitter;
};

export const getChannelFromTwitterID = (tw: string): string => {
  for (let channel in channelParams) {
    const cid = channelParams[channel];
    if (cid.twitter == tw) {
      return channel;
    }
  }

  return "";
};

const VIDEO_LIST_URL = URL_BASE + "video_list?channel=all";
const CHANNEL_INFO_URL = URL_BASE + "channel_info";
const SCHEDULE_TWEET = URL_BASE + "schedule_tweet";
const SYSTEM_STATUS = URL_BASE + "system";
const INFORMATION = URL_BASE + "information";

function Main() {
  const { useState, useEffect } = React;
  const navigate = useNavigate(); // historyを用意する

  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<any>();
  const [tabSelect, setTabSelect] = useState("1");
  const [systemStatus, setSystemStatus] = useState("");
  const [informations, setInformations] = useState<any[]>([]);

  // 予定表ツイート
  const [scheduleTweet, setScheduleTweetList] = useState<any[]>([]);
  // 本日の配信予定 or 配信済み
  const [videoTodayList, setVideoTodayList] = useState<any[]>([]);
  // 明日以降
  const [videoFutureList, setVideoFutureList] = useState<any[]>([]);
  // 過去の配信 or 配信済み
  const [videoArchiveList, setVideoArchiveList] = useState<any[]>([]);

  // フィルタリング時のマスター
  const [videoTodayListMaster, setVideoTodayListMaster] = useState<any[]>([]);
  const [videoFutureListMaster, setVideoFutureListMaster] = useState<any[]>([]);
  const [videoArchiveListMaster, setVideoArchiveListMaster] = useState<any[]>([]);
  const [scheduleTweetListMaster, setScheduleTweetListMaster] = useState<any[]>([]);

  // コールバック中に参照したいのでrefオブジェクトを作成
  const videoTodayListRef = React.useRef<any[]>();
  const videoFutureLListRef = React.useRef<any[]>();
  const videoArchiveListRef = React.useRef<any[]>();
  const scheduleTweetListRef = React.useRef<any[]>();
  videoTodayListRef.current = videoTodayListMaster;
  videoFutureLListRef.current = videoFutureListMaster;
  videoArchiveListRef.current = videoArchiveListMaster;
  scheduleTweetListRef.current = scheduleTweetListMaster;

  const [sortSelect, setSortSelect] = useState<Set<string>>(new Set([]));

  const createSukedule = (ci_list: any, v_list: any[]) => {
    const archiveListMaster: React.SetStateAction<any[]> = [];
    const futureListMaster: React.SetStateAction<any[]> = [];
    const seasonsTodayList: React.SetStateAction<any[]> = [];
    const seasonsTodayFinishList: React.SetStateAction<any[]> = [];

    v_list.forEach((obj: any, index: number) => {
      let isToday = false;
      let isTodayFinished = false;
      let isFuture = false;
      let isArchive = false;
      let isTodayUpload = false;

      // 開始時刻が有効な場合
      if (obj.startAt) {
        // 本日の配信か、もっと未来の配信予定か、アーカイブor動画か
        const now = new Date();
        // 日付変更を跨いでいた場合は昨日からカウント
        // 3:59 まで
        const ofsDay = now.getHours() < 4 ? -1 : 0;

        const startDt = addHours(startOfDay(addDays(now, ofsDay)), 4); // 本日の午前4時を取得
        const endDt = addDays(startDt, 1); // 本日の午前4時に1日を加算して本日の終わりを取得

        let dt_str = "";
        if (obj.startAt.indexOf("未定") == 0) {
          // dt_str = "未定";
          // isFuture = true;
          // 未定は表示しない
          return;
        } else {
          const dt = new Date(obj.startAt);
          dt_str = format(new Date(dt), "yyyy/MM/dd HH:mm");
          if (startDt.getTime() > dt.getTime()) {
            // 過去
            isArchive = true;
          } else if (endDt.getTime() < dt.getTime()) {
            // 未来
            isFuture = true;
          } else if (obj.liveBroadcastContent == "none" && obj.liveStreamingDetails != undefined) {
            // 本日の終了分
            dt_str = format(new Date(new Date(obj.liveStreamingDetails.actualEndTime)), "yyyy/MM/dd HH:mm");
            isTodayFinished = true;
          } else if (obj.liveStreamingDetails == undefined) {
            // 本日アップロードされた動画
            isTodayUpload = true;
          } else {
            // 本日
            isToday = true;
          }
        }

        // 動画とチャンネル情報の照合
        const ci = getChannelInfo(ci_list, obj);

        const card = (
          <Grid item sm={4} md={3} lg={2} key={index + "-" + obj.channel}>
            <MediaCard
              imgUrl={obj.snippet.thumbnails.maxres?.url ? obj.snippet.thumbnails.maxres?.url : obj.snippet.thumbnails.medium?.url}
              videoId={obj.id}
              title={obj.snippet?.title}
              description={obj.snippet?.description}
              startDateTime={dt_str}
              status={obj.liveBroadcastContent}
              isTodayFinished={isTodayFinished}
              isTodayUpload={isTodayUpload}
              isToday={isToday}
              channelInfo={ci}
              isMemberOnly={obj.isMemberOnly == true}
            ></MediaCard>
          </Grid>
        );

        if (isArchive) {
          archiveListMaster.push(card);
        } else if (isFuture) {
          futureListMaster.unshift(card);
        } else if (isTodayFinished) {
          seasonsTodayFinishList.unshift(card);
        } else if (isTodayUpload) {
          seasonsTodayFinishList.push(card);
        } else {
          seasonsTodayList.unshift(card);
        }
      }
    });

    const todayListMaster = seasonsTodayList.concat(seasonsTodayFinishList);
    return { archiveListMaster, futureListMaster, todayListMaster };
  };

  // フィルターリセット
  const resetBtnClickCB = React.useCallback(() => {
    setVideoTodayList((vl) => videoTodayListRef!.current!);
    setVideoFutureList((fl) => videoFutureLListRef!.current!);
    setVideoArchiveList((vl) => videoArchiveListRef!.current!);
    setScheduleTweetList((sl) => scheduleTweetListRef!.current!);

    setSortSelect((_s) => {
      _s.clear();
      return _s;
    });
  }, []);

  // フィルター系ボタンが押された時のコールバック
  const fillterBtnClickCB = React.useCallback(
    (channel: string) => {
      if (sortSelect.has(channel)) {
        sortSelect?.delete(channel);
      } else {
        sortSelect?.add(channel);
      }
      setSortSelect(sortSelect);

      if (sortSelect.size == 0) {
        resetBtnClickCB();
      } else {
        // フィルタイング結果を反映
        const vl = videoTodayListRef!.current!;
        setVideoTodayList(vl.filter((x) => sortSelect.has(x.key.split("-")[1])));
        const fl = videoFutureLListRef!.current!;
        setVideoFutureList(fl.filter((x) => sortSelect.has(x.key.split("-")[1])));
        const al = videoArchiveListRef!.current!;
        setVideoArchiveList(al.filter((x) => sortSelect.has(x.key.split("-")[1])));
        const tl = scheduleTweetListRef!.current!;
        setScheduleTweetList(tl.filter((x) => sortSelect.has(getChannelFromTwitterID(x.UserName))));
      }
    },
    [resetBtnClickCB, setSortSelect, sortSelect]
  );

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

    const promise1 = axiosInstance.get(CHANNEL_INFO_URL, {
      signal: controller.signal,
    });
    const promise2 = axiosInstance.get(VIDEO_LIST_URL, {
      signal: controller.signal,
    });
    const promise3 = axiosInstance.get(SCHEDULE_TWEET, {
      signal: controller.signal,
    });
    const promise4 = axiosInstance.get(SYSTEM_STATUS, {
      signal: controller.signal,
    });
    const promise5 = axiosInstance.get(INFORMATION, {
      signal: controller.signal,
    });

    Promise.all([promise1, promise2, promise3, promise4, promise5]).then(function (values) {
      const { data: ci_data, status: ci_status } = values[0];
      // チャンネル情報
      setChannelInfo(ci_data);

      const { data: t_data, status: t_status } = values[2];
      const { data: v_data, status: v_status } = values[1];
      const tmp_v_date = v_data.filter((item: any) => {
        if (item.isDeleted === "true") {
          return false;
        }

        if (item.startAt.indexOf("未定") == 0) {
          return true;
        }
        const t1 = new Date(item.startAt);
        const t2 = subDays(new Date(), 7);
        return t1 > t2;
      });

      // for (let item of v_data) {
      //   if (item.id == "AeHrOpahLLU") {
      //     console.log();
      //   }
      // }

      // 取得した動画一覧をリストに格納
      const { archiveListMaster, futureListMaster, todayListMaster } = createSukedule(ci_data, tmp_v_date);

      // 件数を減らす
      // 直近一週間分
      setVideoTodayListMaster(todayListMaster.concat());
      setVideoFutureListMaster(futureListMaster.concat());
      setVideoArchiveListMaster(archiveListMaster.concat());
      setScheduleTweetListMaster(t_data.concat()); // ツイート
      // 本日の配信は先行でこの時点で入れる
      setVideoTodayList(todayListMaster);
      setVideoFutureList(futureListMaster);
      setVideoArchiveList(archiveListMaster);
      setScheduleTweetList(t_data); // ツイート

      const { data: s_data, status: s_status } = values[3];
      setSystemStatus(s_data.mode);

      const { data: i_data, status: i_status } = values[4];
      setInformations(i_data);

      setLoaded(true);
      console.log("read ok");
    });

    return () => {
      controller.abort();
    };
  }, []);

  // タブのコールバック
  const onChangeTab = (event: React.SyntheticEvent, newValue: string) => {
    setTabSelect(newValue);
  };

  const GodName = (): string => {
    const r = Math.floor((Math.random() - 0.01) * 3);
    const names = ["神白ななせさん", "GOD神白", "神ちゃん"];
    return names[r];
  };

  return (
    <Box sx={{ background: "linear-gradient(135deg, #FFF6F3,#E7FDFF)" }}>
      <Backdrop sx={{ color: "#fff", zIndex: 1000 }} open={!isLoaded}>
        <CircularProgress sx={{ color: "#FFC84F" }} size="8rem" />
      </Backdrop>

      <Box sx={{ padding: "10px", overflow: "hidden", minHeight: "100vh" }}>
        <Typography align="center" fontFamily="'RocknRoll One'" mx={1} sx={{ fontSize: "14vw" }}>
          ゆにじゅ～る
        </Typography>
        <Typography sx={{ textAlign: "right" }}>ゆにれいど！[非公式]ファンメイドスケジューラー</Typography>
        <Typography sx={{ textAlign: "right", fontSize: "0.75rem" }}>build {buildDate}</Typography>
        <Typography sx={{ textAlign: "right", fontSize: "0.75rem", marginBottom: "4px" }}>
          お問い合わせ <Link href="https://x.com/distant_zz">@distant_zz</Link>
        </Typography>

        {/* "online" */}
        {isLoaded && systemStatus == "online" && (
          <>
            <TabContext value={tabSelect}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                <TabList onChange={onChangeTab} aria-label="チャンネルフィルター">
                  <Tab label="LIVE" value="1" />
                  <Tab
                    label="VOICE BUTTON"
                    value="2"
                    onClick={() => {
                      navigate("/sp/voice_button");
                    }}
                    sx={{
                      color: "#0371D6",
                      textDecoration: "underline",
                    }}
                  />

                  <Tab label="SUMMARY" value="3" />
                  <Tab label="READ ME" value="4" />
                </TabList>
              </Box>
              <TabPanelEx value="1">
                {/* ソートボタン */}
                <ChannelFillter channelInfo={channelInfo} fillterBtnClickCB={fillterBtnClickCB} sortSelect={sortSelect} resetBtnClickCB={resetBtnClickCB} />
              </TabPanelEx>
              <TabPanelEx value="3">
                {/* サマリー */}
                <Summary channelInfo={channelInfo} />
              </TabPanelEx>
              <TabPanelEx value="4">
                {/* Readme */}
                <ReadMe />
              </TabPanelEx>
            </TabContext>

            <Box my={1}>
              <Divider></Divider>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#00C070 !important" }}>本日の配信 ～04:00まで (メン限対応しました)</HeaderBox>
            {/* 本日の配信、動画リスト */}
            {videoTodayList.length != 0 && (
              <Box sx={{ flexGrow: 1, width: "100%", margin: "0px auto", minHeight: "40px" }}>
                <Grid container spacing={4}>
                  {videoTodayList}
                </Grid>
              </Box>
            )}
            {videoTodayList.length == 0 && (
              <Box sx={{ minHeight: "140px" }}>
                <Box py={1} px={2}>
                  <Typography sx={{ fontSize: "0.75rem" }}>そこ(Youtube)に無ければ(ゆにじゅ～るには)無いですね</Typography>
                  <Typography sx={{ fontSize: "0.75rem" }}>{GodName()}の朝活を見たら、誰かの予定がわかるかも？</Typography>
                  <Typography sx={{ fontSize: "0.75rem" }}>もしくは各自のX(旧Twitter)にはあるかもしれません</Typography>
                </Box>
              </Box>
            )}

            {informations.length > 0 && (
              <>
                <HeaderBox sx={{ backgroundColor: "#AAC3F1 !important", marginTop: "20px !important", color: "#ffffff  !important" }}>インフォメーション</HeaderBox>

                {(function () {
                  const list = [];
                  for (let i = 0; i < informations.length; i++) {
                    const info = informations[i];
                    list.push(
                      <Grid item key={i} sm={6} md={4} lg={3}>
                        <InformationCard key={i} title={info.title} detail={info.detail} imgUrl={info.image} url={info.url} startDateTime={info.startAt} endDateTime={info.endAt}></InformationCard>
                      </Grid>
                    );
                  }
                  return (
                    <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
                      <Grid container spacing={4}>
                        {list}
                      </Grid>
                    </Box>
                  );
                })()}
              </>
            )}

            <HeaderBox sx={{ backgroundColor: "#3f3f3f !important", marginTop: "20px !important" }}>X(Twitter)の予定表</HeaderBox>
            {scheduleTweet.length != 0 && (
              <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
                <Grid container spacing={4}>
                  {(() => {
                    const ret = [];
                    for (let item of scheduleTweet) {
                      // https://twitter.com/GunjoRoman/status/1802985228325052782
                      const spl = item.LinkToTweet.split("/status/");
                      const id = spl[1];
                      ret.push(
                        <Grid item key={id} sm={6} md={4} lg={3}>
                          <Tweet tweetId={id} options={{ lang: "Ja", width: "auto" }} />
                        </Grid>
                      );
                    }

                    return ret;
                  })()}
                </Grid>
              </Box>
            )}

            <HeaderBox>明日以降の配信 / プレミア公開</HeaderBox>
            {/* 本日以降の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoFutureList}
              </Grid>
            </Box>

            <HeaderBox sx={{ backgroundColor: "#F28020 !important" }}>過去7日分のアーカイブ / 動画</HeaderBox>
            {/* 過去の配信、動画リスト */}
            <Box sx={{ flexGrow: 1, width: "100%", margin: "20px auto" }}>
              <Grid container spacing={4}>
                {videoArchiveList}
              </Grid>
            </Box>
          </>
        )}

        {systemStatus == "close" && (
          <Box
            sx={{
              marginTop: "60px",
            }}
          >
            <Typography sx={{ textAlign: "center" }}>＼ぺこり／</Typography>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img src={`ojigi_animal_neko.png`} loading="lazy" width="20%" />
            </Box>
            <Typography sx={{ textAlign: "center" }}>現在、システムメンテナンス中です</Typography>
            <Typography sx={{ textAlign: "center" }}>ご迷惑をおかけします</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Main;
