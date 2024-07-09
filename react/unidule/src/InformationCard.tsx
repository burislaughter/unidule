import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { Avatar, Box, Link } from "@mui/material";
import styled from "@emotion/styled";
import { format } from "date-fns";
import "./InformationCard.css";
import { MdStars } from "react-icons/md";

type Props = {
  imgUrl: string;
  title: string;
  detail: string;

  startDateTime: string; // 開始時間
  endDateTime: string; // 終了時間
  url: string; // キャンペーンページ、ECサイト
};

const CardContentEx = styled(CardContent)`
  padding: 4px;
  word-break: break-all;
  &:last-child {
    padding: 0;
  }
`;

export const InformationCard = ({
  imgUrl,
  title,
  detail,

  startDateTime,
  endDateTime,
  url,
}: Props) => {
  let startDateStr = "";
  let startTimeStr = "";
  let endDateStr = "";
  let endTimeStr = "";
  let startDateTimeStateStr = " ～ ";

  startDateStr = format(new Date(startDateTime), "yyyy年M月d日");
  startTimeStr = format(new Date(startDateTime), "HH:mm");
  endDateStr = format(new Date(endDateTime), "yyyy年M月d日");
  endTimeStr = format(new Date(endDateTime), "HH:mm");

  // 配信時間の表示スタイル
  // const timeStyle =
  //   status == "live" || status == "upcoming"
  //     ? {
  //         fontSize: "1rem",
  //         color: "#000",
  //         fontWeight: 700,
  //       }
  //     : {
  //         fontSize: "1rem",
  //       };

  return (
    <Box sx={{ position: "relative" }}>
      <Card>
        <Link target="_brank" href={url}>
          <CardMedia image={imgUrl} component="img" loading="lazy" />
        </Link>
        <CardContentEx>
          <Box>
            <Typography component="span" variant="subtitle1" gutterBottom sx={{ fontWeight: "bold" }}>
              {title}
            </Typography>
          </Box>

          {startDateStr && ( // 配信済または動画
            <Typography variant="body2" color="#000000">
              <Typography component="span" sx={{ marginRight: "2px", fontSize: "1.0rem", fontWeight: 600 }}>
                {startDateStr}
              </Typography>
              <Typography component="span" sx={{ marginRight: "2px", fontSize: "0.8rem", color: "#333" }}>
                {startTimeStr}
              </Typography>

              {startDateTimeStateStr}
              <Typography component="span" sx={{ marginRight: "2px", fontSize: "1.0rem", fontWeight: 600 }}>
                {endDateStr}
              </Typography>

              <Typography component="span" sx={{ marginRight: "2px", fontSize: "0.8rem", color: "#333" }}>
                {endTimeStr}
              </Typography>
            </Typography>
          )}
        </CardContentEx>

        <Box sx={{ paddingBottom: 1 }}>
          <Typography className="description-area">{detail}</Typography>
        </Box>
      </Card>
    </Box>
  );
};
