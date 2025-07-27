import { Box } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

type DateComponentsProps = {
    label:string;
    onChange:any;
}

export const DateComponents = (props:DateComponentsProps): JSX.Element => {
  return (
    <Box>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        dateFormats={{ year: 'YYYY年' }} // カレンダー内の年一覧のフォーマット
      >
        <DatePicker
          label={props.label}
          format="YYYY/MM/DD" // テキストエリア内のフォーマット
          slotProps={{ calendarHeader: { format: 'YYYY年MM月' } }} // カレンダーヘッダーのフォーマット
          onChange={props.onChange}
        />
      </LocalizationProvider>
    </Box>
  );
};