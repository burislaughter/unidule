import * as React from "react";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Box, CardActionArea, Link, colors } from "@mui/material";
import styled from "@emotion/styled";
import { format } from "date-fns";
import "./MediaCard.css";

type Props = {
  imgUrl: string;
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;

  startDateTime: string; // 実際の開始時間
  status: string; // ステータス  live （ライブ配信中）       upcoming　（ライブ配信予約）    none　（ライブ配信終了） published　（動画公開）       premier プレミア
  isTodayFinished: boolean; // 本日の終了した配信
  isTodayUpload: boolean; // 本日アップロードされた動画
};

const CardContentEx = styled(CardContent)`
  padding: 4px;
  word-break: break-all;
  &:last-child {
    padding: 0;
  }
`;

export const MediaCard = ({
  imgUrl,
  videoId,
  title,
  channelTitle,
  description,

  startDateTime,
  status,
  isTodayFinished,
  isTodayUpload,
}: Props) => {
  let startDateStr = "";
  let startTimeStr = "";
  let startDateTimeStateStr = "";

  startDateStr = format(new Date(startDateTime), "yyyy/MM/dd");
  startTimeStr = format(new Date(startDateTime), "HH:mm");

  if (status == "upcoming") {
    // 配信予定
    startDateTimeStateStr = " に配信予定";
  } else if (status == "live") {
    // 配信中
    startDateTimeStateStr = " から配信中";
  } else if (isTodayFinished) {
    startDateTimeStateStr = " に配信終了";
  } else if (isTodayUpload) {
    startDateTimeStateStr = " に公開";
  } else if (status == "none") {
    startDateTimeStateStr = " に配信";
  } else {
    startDateTimeStateStr = " に公開";
  }

  // ショート動画かどうか
  const linkBaseUrl = title.indexOf("#shorts") == -1 ? "https://www.youtube.com/watch?v=" : "https://www.youtube.com/shorts/";

  // 配信時間の表示スタイル
  const timeStyle =
    status == "live" || status == "upcoming"
      ? {
          fontSize: "0.875rem",
          color: "#000",
          fontWeight: 700,
        }
      : {
          fontSize: "0.875rem",
        };

  return (
    <Card sx={{}} className={(status == "live" ? "Now-border" : "") + (isTodayFinished ? " Now-border finished" : "") + " Card-parent"}>
      <Link target="_brank" href={linkBaseUrl + videoId}>
        <CardMedia
          sx={
            {
              //  objectViewBox: inset(80px 180px 30px 20px);
            }
          }
          image={imgUrl}
          // component="img"
        />
      </Link>
      <CardContentEx>
        <Typography variant="body2" gutterBottom component="div" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {channelTitle}
        </Typography>

        {startDateStr && ( // 配信済または動画
          <Typography variant="body2" color="text.secondary">
            {startDateStr}{" "}
            <Typography component="span" sx={timeStyle}>
              {startTimeStr}
            </Typography>
            {startDateTimeStateStr}
          </Typography>
        )}

        {status == "live" && <Typography className="Now-icon">LIVE!</Typography>}

        {isTodayFinished && <Typography className="Now-icon finished">FINISHED</Typography>}

        {isTodayUpload && <Typography className="Now-icon upload">Release</Typography>}
      </CardContentEx>

      <Box sx={{ paddingBottom: 1 }}>
        <Typography className="description-area">{description}</Typography>
      </Box>
    </Card>
  );
};
