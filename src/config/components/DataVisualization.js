import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DataVisualization = ({ data }) => {
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('');

  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // Process the data for visualization
    return data.map((row, index) => {
      const processedRow = { index: index + 1 };
      Object.keys(row).forEach(key => {
        const value = row[key];
        // Try to convert to number if possible
        const numValue = parseFloat(value);
        processedRow[key] = isNaN(numValue) ? value : numValue;
      });
      return processedRow;
    });
  }, [data]);

  const numericColumns = useMemo(() => {
    if (!processedData.length) return [];
    return Object.keys(processedData[0]).filter(key => 
      key !== 'index' && typeof processedData[0][key] === 'number'
    );
  }, [processedData]);

  const categoricalColumns = useMemo(() => {
    if (!processedData.length) return [];
    return Object.keys(processedData[0]).filter(key => 
      key !== 'index' && typeof processedData[0][key] === 'string'
    );
  }, [processedData]);

  // Aggregate data for pie chart
  const pieData = useMemo(() => {
    if (!selectedMetric || !categoricalColumns.length) return [];
    
    const aggregated = {};
    processedData.forEach(row => {
      const category = row[categoricalColumns[0]] || 'Unknown';
      const value = row[selectedMetric] || 0;
      aggregated[category] = (aggregated[category] || 0) + value;
    });
    
    return Object.entries(aggregated).map(([name, value]) => ({ name, value }));
  }, [processedData, selectedMetric, categoricalColumns]);

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No data available for visualization
        </Typography>
      </Box>
    );
  }

  const renderChart = () => {
    if (!selectedMetric) return null;

    const chartProps = {
      width: '100%',
      height: 400,
      data: chartType === 'pie' ? pieData : processedData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...chartProps}>
            <LineChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#8884d8" 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer {...chartProps}>
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey={selectedMetric} 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer {...chartProps}>
            <BarChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={selectedMetric} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer {...chartProps}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Data Visualization
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Chart Configuration
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Chart Type</InputLabel>
              <Select
                value={chartType}
                label="Chart Type"
                onChange={(e) => setChartType(e.target.value)}
              >
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Metric</InputLabel>
              <Select
                value={selectedMetric}
                label="Metric"
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {numericColumns.map(column => (
                  <MenuItem key={column} value={column}>
                    {column.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Data Summary */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Data Summary
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rows: {processedData.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Numeric Columns: {numericColumns.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Text Columns: {categoricalColumns.length}
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 500 }}>
            {selectedMetric ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedMetric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} - {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                </Typography>
                {renderChart()}
              </Box>
            ) : (
              <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                height="100%"
              >
                <Typography variant="h6" color="text.secondary">
                  Select a metric to visualize
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataVisualization;