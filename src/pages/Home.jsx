import React, { useState, useEffect } from 'react';
import { Box, Typography, Pagination } from '@mui/material';
import DoubtList from '../components/DoubtList';
import DoubtForm from '../components/DoubtForm';
import api from '../utils/api';

function Home() {
  const [doubts, setDoubts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDoubts = async () => {
    try {
      const response = await api.get('/discussions/doubts', {
        params: { page, limit: 10 },
      });
      setDoubts(response.data.doubts);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching doubts:', error);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [page]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Doubts
      </Typography>
      <DoubtForm onDoubtCreated={fetchDoubts} />
      <DoubtList doubts={doubts} />
      <Pagination
        count={totalPages}
        page={page}
        onChange={(e, value) => setPage(value)}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />
    </Box>
  );
}

export default Home;