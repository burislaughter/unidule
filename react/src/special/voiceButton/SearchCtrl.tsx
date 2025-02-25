import { Autocomplete, AutocompleteChangeReason, AutocompleteValue, Box, Chip, Input, ListItem, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import { getUniBgColor, getUniBtnColor } from "../../const";

export type SearchCtrlProp = {
  setSearchWords: any;
  searchWords: any;
  voiceButtonListMaster: any;
};

export const SearchCtrl = ({ setSearchWords, searchWords, voiceButtonListMaster }: SearchCtrlProp) => {
  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.SyntheticEvent, value: any, reason: AutocompleteChangeReason) => {
    setSearchWords(value);
    console.log(value);
  };

  const allVoiceTitles: any[] = [];
  const vl = voiceButtonListMaster!;
  if (vl != undefined && vl.length != 0) {
    vl.forEach((x: any) => {
      return x.value.forEach((i: any) => {
        if (allVoiceTitles.find((y) => y.title == i.title) == undefined) {
          allVoiceTitles.push(i);
        }
      });
    });
  }

  return (
    <Box sx={{ height: "100%", marginX: "10px", marginBottom: "10px" }}>
      <Autocomplete
        fullWidth
        multiple
        value={searchWords}
        inputValue={inputValue}
        blurOnSelect={false}
        disableCloseOnSelect={true}
        id="voice-selected"
        options={allVoiceTitles}
        getOptionLabel={(option: any) => option.title}
        renderInput={(params) => <TextField {...params} variant="standard" label="音声検索（自由入力で絞り込めます）" placeholder="" onChange={(e) => setInputValue(e.target.value)} />}
        onChange={handleChange}
        renderOption={(prop: any, option, { selected }) => {
          const { key, ...otherProps } = prop;
          const bgCol = (selected ? getUniBtnColor(option.channel) : getUniBgColor(option.channel)) + " !important";
          const txtCol = selected ? "#FFFFFF" : "#000000";

          return (
            <ListItem key={key} {...otherProps} sx={{ backgroundColor: bgCol }}>
              <ListItemText primary={option.title} sx={{ color: txtCol }} />
            </ListItem>
          );
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            const bgCol = getUniBtnColor(option.channel) + " !important";
            const txtCol = "#FFFFFF";

            return <Chip key={key} label={option.title} {...tagProps} sx={{ backgroundColor: bgCol, color: txtCol }} />;
          })
        }
      />
    </Box>
  );
};
