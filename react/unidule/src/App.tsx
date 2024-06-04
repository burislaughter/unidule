/** @jsxImportSource @emotion/react */
import * as React from "react";
import { Button, Typography } from "@mui/material";
import styled from "@emotion/styled";
import { css } from "@emotion/react";
import axios, { AxiosResponse } from "axios";

const objectStyle = css({
  padding: "10px",
});

function App() {
  const { useState, useEffect } = React;

  const [isLoaded, setLoaded] = useState<boolean>(false);
  const [videoList, setVideoList] = useState<any[]>([]);

  const CHANNEL_MARU_URL = "http://127.0.0.1:5000/maru";

  useEffect(() => {
    const controller = new AbortController();
    axios.defaults.baseURL = "http://localhost:3000";
    axios.defaults.headers.post["Content-Type"] =
      "application/json;charset=utf-8";
    axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";

    const axiosInstance = axios.create({
      withCredentials: false,
      headers: {
        "Content-Type": "application/json",
      },
    });

    axiosInstance
      .get(CHANNEL_MARU_URL, {
        signal: controller.signal,
      })
      .then((res: AxiosResponse<any[]>) => {
        const { data, status } = res;
        console.log(data);

        const seasonsList: React.SetStateAction<any[]> = [];

        data.forEach((obj, index) => {
          seasonsList.push(<li key={index}>{obj.title}</li>);
        });

        setVideoList(seasonsList);

        setLoaded(true);
        console.log("read ok");
      })
      .catch((error) => {
        console.log("失敗");
        console.log(error.status);
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <>
      <div css={objectStyle}>
        <Typography variant="h1" component="h2" mt={2}>
          ゆにじゅ～る(仮設)
        </Typography>
        <Button variant="outlined">Button</Button>
        <Button variant="contained">contained</Button>
        <Button variant="outlined">outlined</Button>
        {isLoaded && <div>{videoList}</div>}

        <div className="App">準備完了しました</div>
      </div>
    </>
  );
}

export default App;
