import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
// Remove these imports for now since components don't exist yet
// import FileUpload from './components/FileUpload';
// import AnalysisDashboard from './components/AnalysisDashboard';
// import DataVisualization from './components/DataVisualization';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          AI Financial Analysis Tool
        </Typography>
        
        <Typography variant="h6" component="p" gutterBottom align="center" color="text.secondary">
          Upload your financial data and get AI-powered insights
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ ml: 2, alignSelf: 'center' }}>
              Analyzing your data...
            </Typography>
          </Box>
        )}

        <Paper sx={{ width: '100%', mt: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Upload Data" />
            <Tab label="Analysis Dashboard" disabled={!analysisData} />
            <Tab label="Data Visualization" disabled={!uploadedData} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6">File Upload Component Coming Soon</Typography>
            <Typography>This will contain the file upload functionality.</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6">Analysis Dashboard Coming Soon</Typography>
            <Typography>This will display AI analysis results.</Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6">Data Visualization Coming Soon</Typography>
            <Typography>This will show charts and graphs.</Typography>
          </TabPanel>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;