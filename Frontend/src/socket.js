
import { io } from "socket.io-client";

const socket = io("http://localhost:8080", {
    autoConnect: false,
    auth: (callback) => {
        const token = localStorage.getItem("token");

        callback({
            token: token || ""
        });
    }
});

export default socket;