import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';

const AnalysisDashboard = ({ data }) => {
  if (!data) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No analysis data available
        </Typography>
      </Box>
    );
  }

  const { analysis, insights, recommendations, summary } = data;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high': return <Warning />;
      case 'medium': return <Info />;
      case 'low': return <CheckCircle />;
      default: return <Assessment />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Financial Analysis Results
      </Typography>

      {/* Summary Section */}
      {summary && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom color="primary">
            Executive Summary
          </Typography>
          <Typography variant="body1" paragraph>
            {summary}
          </Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Main Analysis */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h5" gutterBottom>
              Detailed Analysis
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {typeof analysis === 'string' ? (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {analysis}
              </Typography>
            ) : (
              <Box>
                {Object.entries(analysis || {}).map(([key, value]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    <Typography variant="body1">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Insights & Recommendations */}
        <Grid item xs={12} md={4}>
          {/* Key Insights */}
          {insights && insights.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Key Insights
                </Typography>
                <List dense>
                  {insights.map((insight, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {getSeverityIcon(insight.severity)}
                      </ListItemIcon>
                      <ListItemText
                        primary={insight.title || insight.text || insight}
                        secondary={insight.description}
                      />
                      {insight.severity && (
                        <Chip
                          label={insight.severity}
                          color={getSeverityColor(insight.severity)}
                          size="small"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Recommendations
                </Typography>
                <List dense>
                  {recommendations.map((rec, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <TrendingUp color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={rec.title || rec.text || rec}
                        secondary={rec.description}
                      />
                      {rec.priority && (
                        <Chip
                          label={rec.priority}
                          color={getSeverityColor(rec.priority)}
                          size="small"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisDashboard;