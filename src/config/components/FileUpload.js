import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload,
  Description,
  Delete,
  Send
} from '@mui/icons-material';
import axios from 'axios';

const FileUpload = ({ onAnalysisComplete, onAnalysisStart, onError, onDataUpload, loading }) => {
  const [files, setFiles] = useState([]);
  const [analysisType, setAnalysisType] = useState('general');
  const [customPrompt, setCustomPrompt] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9)
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) {
      onError('Please upload at least one file');
      return;
    }

    onAnalysisStart();

    try {
      const formData = new FormData();
      files.forEach(({ file }) => {
        formData.append('files', file);
      });
      formData.append('analysisType', analysisType);
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

      // First, upload and parse the data
      const uploadResponse = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onDataUpload(uploadResponse.data.parsedData);

      // Then, get AI analysis
      const analysisResponse = await axios.post('/api/analyze', {
        data: uploadResponse.data.parsedData,
        analysisType,
        customPrompt
      });

      onAnalysisComplete(analysisResponse.data);
    } catch (error) {
      console.error('Analysis error:', error);
      onError(error.response?.data?.error || 'Failed to analyze data');
    }
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <input {...getInputProps()} />
        <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: CSV, XLS, XLSX
        </Typography>
      </Paper>

      {files.length > 0 && (
        <Paper sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List>
            {files.map(({ file, id }) => (
              <ListItem key={id} secondaryAction={
                <IconButton edge="end" onClick={() => removeFile(id)}>
                  <Delete />
                </IconButton>
              }>
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(1)} KB`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      <Paper sx={{ mt: 3, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Analysis Configuration
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Analysis Type</InputLabel>
          <Select
            value={analysisType}
            label="Analysis Type"
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <MenuItem value="general">General Financial Analysis</MenuItem>
            <MenuItem value="cashflow">Cash Flow Analysis</MenuItem>
            <MenuItem value="profitability">Profitability Analysis</MenuItem>
            <MenuItem value="trends">Trend Analysis</MenuItem>
            <MenuItem value="custom">Custom Analysis</MenuItem>
          </Select>
        </FormControl>

        {analysisType === 'custom' && (
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Custom Analysis Prompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Describe what specific analysis you want..."
            sx={{ mb: 2 }}
          />
        )}

        <Button
          variant="contained"
          size="large"
          startIcon={<Send />}
          onClick={handleAnalyze}
          disabled={files.length === 0 || loading}
          fullWidth
        >
          {loading ? 'Analyzing...' : 'Analyze Data'}
        </Button>
      </Paper>
    </Box>
  );
};

export default FileUpload;