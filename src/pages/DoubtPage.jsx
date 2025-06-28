import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import { ThumbUp, Visibility } from '@mui/icons-material';
import api from '../utils/api';
import CommentSection from '../components/CommentSection';

function DoubtPage() {
  const { id } = useParams();
  const [doubt, setDoubt] = useState(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const fetchDoubt = async () => {
    try {
      const response = await api.get(`/discussions/doubts/${id}`);
      setDoubt(response.data);
      setLikes(response.data.likes.length);
      setIsLiked(response.data.likes.includes(localStorage.getItem('userId')));
    } catch (error) {
      console.error('Error fetching doubt:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await api.put(`/discussions/doubts/${id}/like`);
      setLikes(response.data.likes);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking doubt:', error);
    }
  };

  const handleResolve = async () => {
    try {
      await api.put(`/discussions/doubts/${id}/resolve`);
      fetchDoubt();
    } catch (error) {
      console.error('Error resolving doubt:', error);
    }
  };

  useEffect(() => {
    fetchDoubt();
  }, [id]);

  if (!doubt) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4">{doubt.title}</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        {doubt.content}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        By {doubt.author.name} | {new Date(doubt.createdAt).toLocaleDateString()}
      </Typography>
      <Box sx={{ mt: 2 }}>
        {doubt.hashtags.map((tag) => (
          <Chip key={tag} label={`#${tag}`} size="small" sx={{ mr: 1 }} />
        ))}
      </Box>
      {doubt.isPinned && <Chip label="Pinned" color="primary" size="small" sx={{ mt: 1 }} />}
      {doubt.isResolved && <Chip label="Resolved" color="success" size="small" sx={{ mt: 1 }} />}
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={handleLike} color={isLiked ? 'primary' : 'default'}>
          <ThumbUp />
          <Typography variant="body2" sx={{ ml: 1 }}>
            {likes}
          </Typography>
        </IconButton>
        <Typography variant="body2" sx={{ ml: 2 }}>
          <Visibility sx={{ verticalAlign: 'middle' }} /> {doubt.views}
        </Typography>
        <Button
          variant="outlined"
          sx={{ ml: 2 }}
          onClick={handleResolve}
          disabled={doubt.author._id !== localStorage.getItem('userId') && localStorage.getItem('role') !== 'admin'}
        >
          {doubt.isResolved ? 'Mark Unresolved' : 'Mark Resolved'}
        </Button>
      </Box>
      {doubt.attachments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Attachments</Typography>
          {doubt.attachments.map((attachment, index) => (
            <Button key={index} href={attachment.url} target="_blank">
              {attachment.type === 'image' ? 'View Image' : 'View PDF'}
            </Button>
          ))}
        </Box>
      )}
      <Divider sx={{ my: 4 }} />
      <CommentSection doubtId={id} />
    </Box>
  );
}

export default DoubtPage;