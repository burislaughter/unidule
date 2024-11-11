import { Autocomplete, AutocompleteChangeReason, AutocompleteValue, Box, Input, Stack, TextField } from "@mui/material";
import { useState } from "react";
import SearchIcon from "@mui/icons-material/Search";

export type SearchCtrlProp = {
  setSearchWord: any;
  voiceButtonListMaster: any;
};

export const SearchCtrl = ({ setSearchWord, voiceButtonListMaster }: SearchCtrlProp) => {
  const handleChange = (event: React.SyntheticEvent, value: any, reason: AutocompleteChangeReason) => {
    // setSearchWord(searchText);
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
    <Box sx={{ height: "100%", marginX: "10px", filter: "drop-shadow(10px 10px 4px rgb(0 0 0 / 0.8))" }}>
      <Autocomplete
        fullWidth
        multiple
        id="tags-standard"
        options={allVoiceTitles}
        getOptionLabel={(option: any) => option.title}
        renderInput={(params) => <TextField {...params} variant="standard" label="音声検索" placeholder="Favorites" />}
        onChange={handleChange}
      />
    </Box>
  );
};
