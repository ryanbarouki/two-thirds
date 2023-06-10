const palette = {
  primary: {
    300: '#ffffff',
    400: '#464856',
    500: '#788aa3',
    600: '#505760',
    700: '#D4F3EF',
    800: '#fff',
  },
  secondary: {
    300: '#6C6C96',
    400: '#b97b7b'
  }
};

export const theme = {
  primary: {
    text: palette.primary[300],
    background: palette.primary[400],
    logo: palette.primary[700],
    button: {
        unpressed: palette.primary[500],
        pressed: palette.primary[600],
    },
    input: palette.primary[800]
  },
  secondary: {
    background: palette.secondary[300],
    button: {
        unpressed: palette.secondary[400],
        pressed: palette.primary[600],
    } 
  }
};