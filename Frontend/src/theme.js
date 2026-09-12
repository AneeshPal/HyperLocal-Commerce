import { createTheme } from '@mui/material/styles';

// Palette grounded in the product's subject: a neighborhood marketplace.
// Deep market-awning teal as the anchor, marigold (street-stall flag colour)
// as the single accent, warm stone neutrals instead of pure grey/white.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2F5D50',
      dark: '#1F4038',
      light: '#4C7A6C',
      contrastText: '#F7F5F0',
    },
    secondary: {
      main: '#E3A008',
      dark: '#B67D06',
      light: '#F0BE4C',
      contrastText: '#1B2320',
    },
    background: {
      default: '#F7F5F0',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B2320',
      secondary: '#5B655F',
    },
    divider: '#E3DED0',
    success: {
      main: '#2F5D50',
    },
    error: {
      main: '#B3462C',
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h2: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h3: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h4: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h5: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    h6: { fontFamily: '"Fraunces", serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none', borderBottom: '1px solid #E3DED0' },
      },
    },
  },
});

export default theme;
