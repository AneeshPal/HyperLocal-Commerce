
import { io } from 'socket.io-client';
import { API_BASE } from './config';

const socket = io(API_BASE, {
  autoConnect: false,
  auth: (callback) => {
    const token = localStorage.getItem('token');

    callback({
      token: token || '',
    });
  },
});

export default socket;
