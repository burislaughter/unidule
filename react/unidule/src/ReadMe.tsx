import { Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, Typography, styled } from "@mui/material";
import { MdNightShelter, MdUpdate, MdOutlineWbSunny } from "react-icons/md";
import { CiBeerMugFull } from "react-icons/ci";
import { MdOutlineNightlife, MdNotificationsOff } from "react-icons/md";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { FaSquareXTwitter } from "react-icons/fa6";
import { WiDayLightWind } from "react-icons/wi";
import "./MediaCard.css";

type ReadMeProps = {};

const ListItemButtonEx = styled(ListItemButton)`
  padding-top: 0px;
  padding-bottom: 0px;

  margin-top: 0px;
  margin-bottom: 0px;
`;

const ListItemTextEx = styled(ListItemText)`
  padding-top: 0px;
  padding-bottom: 0px;

  margin-top: 0px;
  margin-bottom: 0px;
`;

const iconProp = {
  size: 22,
  color: "#666",
};

export const ReadMe = ({}: ReadMeProps) => {
  const rows: any[] = [];

  return (
    <Box>
      <List
        sx={{ width: "100%", bgcolor: "background.paper" }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <ListSubheader component="div" id="nested-list-subheader" sx={{ fontSize: "16px", fontWeight: 700 }}>
            ゆにじゅ～るのレギュレーション（知らなくても困らない事）
          </ListSubheader>
        }
      >
        <ListItemButtonEx>
          <ListItemIcon sx={{ minWidth: 22 }}>
            <WiDayLightWind {...iconProp} />
          </ListItemIcon>
          <ListItemTextEx primary="ゆにじゅ～るは午前4時～翌午前4時を一日としています" primaryTypographyProps={{ fontSize: "14px", fontWeight: 700 }} />
        </ListItemButtonEx>

        <ListItemButtonEx sx={{ marginTop: 2, position: "relative" }}>
          <ListItemIcon sx={{ minWidth: 22 }}>
            <Box sx={{ position: "absolute", top: 0 }}>
              <FaSquareXTwitter size={20} color={"#666"} />
            </Box>
          </ListItemIcon>
          <ListItemTextEx
            primary="Xの予定表は専用タグがある人はタグの付いているポスト、無い人は「予定表」または「スケジュール」のキーワードを元に取得しています。"
            primaryTypographyProps={{ fontSize: "14px", fontWeight: 700 }}
            secondary="掲載期間は7日前まです。"
            secondaryTypographyProps={{ fontSize: "14px" }}
          />
        </ListItemButtonEx>

        <ListItemButtonEx sx={{ marginTop: 2 }}>
          <ListItemIcon sx={{ minWidth: 22 }}>
            <MdUpdate {...iconProp} />
          </ListItemIcon>
          <ListItemTextEx primary="配信予定/状況の更新頻度は下記の通りです" primaryTypographyProps={{ fontSize: "14px", fontWeight: 700 }} />
        </ListItemButtonEx>
        <List component="div" disablePadding>
          <ListItem sx={{ pl: 4, pb: 0 }}>
            <ListItemTextEx primary="ゆにれいど！メンバー" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItem>

          <ListItemButtonEx sx={{ pl: 6 }}>
            <ListItemIcon sx={{ minWidth: 22 }}>
              <MdOutlineWbSunny {...iconProp} />
            </ListItemIcon>
            <ListItemTextEx primary="平日の16時～27時は5分間隔" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItemButtonEx>
          <ListItemButtonEx sx={{ pl: 6, mb: 1 }}>
            <ListItemIcon sx={{ minWidth: 22 }}>
              <MdNightShelter {...iconProp} />
            </ListItemIcon>
            <ListItemTextEx primary="平日の 5時～16時は20分間隔" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItemButtonEx>

          <ListItemButtonEx sx={{ pl: 6 }}>
            <ListItemIcon sx={{ minWidth: 22 }}>
              <CiBeerMugFull {...iconProp} />
            </ListItemIcon>
            <ListItemTextEx primary="土日の12時～29時は5分間隔" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItemButtonEx>
          <ListItemButtonEx sx={{ pl: 6 }}>
            <ListItemIcon sx={{ minWidth: 22 }}>
              <MdOutlineNightlife {...iconProp} />
            </ListItemIcon>
            <ListItemTextEx primary="土日の 5時～12時は20分間隔" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItemButtonEx>

          <ListItem sx={{ pl: 4, pb: 0, pt: 2 }}>
            <ListItemTextEx primary="ゆにれいど！公式関連" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItem>
          <ListItemButtonEx sx={{ pl: 6 }}>
            <ListItemIcon sx={{ minWidth: 22 }}>
              <HiOutlineOfficeBuilding {...iconProp} />
            </ListItemIcon>
            <ListItemTextEx primary="1時間間隔" primaryTypographyProps={{ fontSize: "14px" }} />
          </ListItemButtonEx>
        </List>
      </List>
    </Box>
  );
};
