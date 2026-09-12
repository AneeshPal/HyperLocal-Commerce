import { createTheme } from '@mui/material/styles';

// Palette: "Electric Sage" — a deep, confident forest-green anchor with a
// punchy electric-lime accent. Reads premium (green = trust, good for
// payments/escrow) while the lime keeps it energetic for a Gen-Z audience,
// instead of the usual teal/orange marketplace combo.
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1F4B3F',
      dark: '#153A30',
      light: '#3D6B5C',
      contrastText: '#FAF9F5',
    },
    secondary: {
      main: '#C4F135',
      dark: '#A3CC28',
      light: '#D6F76B',
      contrastText: '#153A30',
    },
    background: {
      default: '#FAF9F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B2320',
      secondary: '#5B655F',
    },
    divider: '#E3DED0',
    success: {
      main: '#1F4B3F',
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