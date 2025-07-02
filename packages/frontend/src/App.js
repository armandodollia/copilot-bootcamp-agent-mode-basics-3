import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  TextField, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css';

/**
 * Main App component for the item management application
 * Follows project guidelines for component structure and error handling
 */
function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/items');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!newItem.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newItem }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      const result = await response.json();
      setData([...data, result]);
      setNewItem('');
    } catch (err) {
      setError('Error adding item: ' + err.message);
      console.error('Error adding item:', err);
    }
  };

  const handleDelete = async id => {
    setDeleteLoading(id);
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove the deleted item from the state
      setData(data.filter(item => item.id !== id));
      setError(null);
    } catch (err) {
      setError('Error deleting item: ' + err.message);
      console.error('Error deleting item:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hello World</h1>
        <p>Connected to in-memory database</p>
      </header>

      <main>
        <section className="add-item-section">
          <Typography variant="h5" component="h2" gutterBottom>
            Add New Item
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              placeholder="Enter item name"
              margin="normal"
              label="Item Name"
              sx={{ flex: 1 }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              sx={{ mt: 2 }}
            >
              Add Item
            </Button>
          </form>
        </section>

        <section className="items-section">
          <Typography variant="h5" component="h2" gutterBottom>
            Items from Database
          </Typography>
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          )}
          
          {error && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
          
          {!loading && !error && (
            data.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table aria-label="items table">
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="subtitle2">Item Name</Typography></TableCell>
                      <TableCell align="right"><Typography variant="subtitle2">Actions</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteLoading === item.id}
                          >
                            {deleteLoading === item.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" sx={{ p: 2 }}>
                No items found. Add some!
              </Typography>
            )
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
