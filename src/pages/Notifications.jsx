import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import api from '../utils/api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/discussions/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/discussions/notifications/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Notifications
      </Typography>
      <List>
        {notifications.map((notification) => (
          <ListItem
            key={notification._id}
            sx={{ bgcolor: notification.isRead ? 'inherit' : 'action.hover' }}
          >
            <ListItemText
              primary={
                notification.type === 'new_doubt'
                  ? `New doubt: ${notification.doubt.title}`
                  : notification.type === 'new_comment'
                  ? `New comment on: ${notification.doubt.title}`
                  : notification.type === 'like_doubt'
                  ? `Your doubt got a like: ${notification.doubt.title}`
                  : notification.type === 'like_comment'
                  ? `Your comment got a like`
                  : notification.type === 'tagged'
                  ? `You were tagged in a comment`
                  : `Hashtag #${notification.hashtag} liked`
              }
              secondary={`From ${notification.sender.name} | ${new Date(notification.createdAt).toLocaleDateString()}`}
            />
            {!notification.isRead && (
              <Button onClick={() => handleMarkRead(notification._id)}>Mark as Read</Button>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default Notifications;