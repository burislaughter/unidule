import { Avatar, Box, Link, Typography } from "@mui/material";
import { DeleteKeyContext, DeleteModeFlagContext, VolumeContext } from "./VoiceButton";
import { VoiceButtonOne, VoiceButtonOneProps } from "./VoiceButtonOne";
import { HeaderBoxGroups } from "../../styled";

export type ViewCategoryProp = {
  voiceButtonGroupList: any[];
  ciDataList: any[];

  volume: number;
  deleteKey: string;
  isDeleteMode: boolean;
  isAdmin: boolean;

  setReLoadCt: any;
  setSelectVoice: any;
  setYtPalyerShotState: any;
};

export const ViewCategory = ({ voiceButtonGroupList, ciDataList, volume, deleteKey, isDeleteMode, isAdmin, setReLoadCt, setSelectVoice, setYtPalyerShotState }: ViewCategoryProp) => {
  {
    /* ancer */
  }
  return (
    <Box>
      <Box className="anker-group">
        <Typography className="anker-group-title">カテゴリー一覧</Typography>

        {voiceButtonGroupList?.map((x) => {
          const name = x.key;
          return (
            <Link key={"Anker" + name} marginRight={"8px"} href={"#" + name} className="anker-gradient">
              <Typography component="span" sx={{ color: "#FFF", display: "inline-block" }}>
                {name}
              </Typography>
            </Link>
          );
        })}
      </Box>
      <Box sx={{ marginTop: 0 }}>
        {voiceButtonGroupList?.map((x) => {
          const name = x.key;
          const item = x.value;

          const categoryChannelList = [];
          for (const key in item) {
            const spl_key = key.split("_");
            const c_idx = Number(spl_key[0]);
            const c_name = spl_key[1];

            const ci = ciDataList.filter((x: any) => x.channel == c_name);
            const groupItem: VoiceButtonOneProps[] = item[key];

            const gloup = (
              <Box key={name + key} sx={{ marginLeft: "48px", marginTop: "2px", position: "relative" }}>
                <Avatar
                  src={ci[0]?.snippet?.thumbnails?.default?.url}
                  sx={{
                    width: 44,
                    left: -44,
                    boxShadow: 3,
                    position: "absolute",
                  }}
                />

                <Box sx={{ lineHeight: "12px" }}>
                  {/* カテゴリー名毎 */}
                  <Box>
                    {groupItem?.map((item_one: any, index: number) => {
                      return (
                        <VolumeContext.Provider value={volume} key={index}>
                          <DeleteKeyContext.Provider value={deleteKey}>
                            <DeleteModeFlagContext.Provider value={isDeleteMode}>
                              <Box component="span" sx={{ marginX: "2px", marginBottom: "4px" }}>
                                <VoiceButtonOne
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
                                  setYtPalyerShotState={setYtPalyerShotState}
                                  tag={item_one.tag}
                                />
                              </Box>
                            </DeleteModeFlagContext.Provider>
                          </DeleteKeyContext.Provider>
                        </VolumeContext.Provider>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            );

            // categoryChannelList.push(gloup);
            categoryChannelList[c_idx] = gloup;
          }

          return (
            <Box key={name} sx={{ marginBottom: "16px" }}>
              <HeaderBoxGroups sx={{ backgroundColor: "#FFFFFF", paddingLeft: "4px", marginBottom: "4px", display: "block" }} className="original-gradient">
                <Typography id={name} sx={{ lineHeight: "10px", color: "#222", fontWeight: 300, paddingTop: "80px", marginTop: "-80px" }}>
                  {name}
                </Typography>
              </HeaderBoxGroups>
              {categoryChannelList}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
